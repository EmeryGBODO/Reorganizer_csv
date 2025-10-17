
import React, { useState, useEffect, useMemo } from 'react';
import { Download, UploadCloud, ChevronLeft, CheckCircle, ChevronRight, FileSignature } from 'lucide-react';
import DragDropZone from '../components/DragDropZone';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import DataTable from '../components/DataTable';
import Stepper from '../components/Stepper';
import { Campaign, DataRow } from '../types';
import { campaignApi, fileApi } from '../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const PREVIEW_ROW_COUNT = 20;

type Step = 'select_campaign' | 'upload_file' | 'view_data';

export interface UploadState {
    isUploading: boolean;
    success: boolean;
    error: string | null;
    progress: number;
}

const IMPORT_STEPS = [
    { id: 'select_campaign', title: 'Choisir la Campagne' },
    { id: 'upload_file', title: 'Importer le Fichier' },
    { id: 'view_data', title: 'Visualiser et Traiter' },
];

const ImportPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState<Step>('select_campaign');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [fullData, setFullData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [uploadState, setUploadState] = useState<UploadState>({ isUploading: false, success: false, error: null, progress: 0 })
    const [outputFileName, setOutputFileName] = useState('');
    const navigate = useNavigate();


    // Fonction pour valider les en-têtes du fichier
    const validateHeaders = (fileHeaders: string[]) => {
        if (!selectedCampaign) return { isValid: true, missingColumns: [] };

        console.log('File headers:', fileHeaders);
        console.log('Required columns:', selectedCampaign.columns.map(col => col.displayName));

        const requiredColumns = selectedCampaign.columns.map(col => col.displayName);
        const missingColumns = requiredColumns.filter(col => !fileHeaders.includes(col));

        return {
            isValid: missingColumns.length === 0,
            missingColumns
        };
    };

    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                setIsLoading(true);
                const campaignsRes = await campaignApi.getAll();
                setCampaigns(campaignsRes.data || []);
            } catch (err) {
                setError('Erreur lors du chargement des campagnes.');
            } finally {
                setIsLoading(false);
            }
        };
        loadCampaigns();
    }, []);

    useEffect(() => {
        if (selectedCampaign) {
            setOutputFileName(selectedCampaign.output_file_name || 'donnees_traitees.csv');
        }
    }, [selectedCampaign]);


    const handleCampaignSelection = (campaignId: string | number) => {

        const campaign = campaigns.find(c => c.id == campaignId);
        setSelectedCampaign(campaign || null);
        if (campaign) {
            setCurrentStep('upload_file');
        }
    };




    const handleFileDrop = (file: File) => {
        setIsProcessing(true); // Le loader démarre
        setError(null);
        setSelectedFile(file); // On stocke le fichier immédiatement

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const fileContent = e.target?.result;
                const extension = file.name.split('.').pop()?.toLowerCase();
                let jsonData: DataRow[] = [];

                // --- Logique unifiée pour tous les types de fichiers ---

                if (extension === 'csv') {
                    // On utilise PapaParse pour lire le contenu CSV
                    const parsedData = Papa.parse(fileContent as string, {
                        header: true, // Très important: traite la première ligne comme des en-têtes
                        skipEmptyLines: true,
                    });
                    jsonData = parsedData.data as DataRow[];

                } else if (extension === 'xlsx' || extension === 'xls') {
                    // On utilise XLSX pour lire le contenu Excel
                    const data = new Uint8Array(fileContent as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    jsonData = XLSX.utils.sheet_to_json(firstSheet) as DataRow[];

                } else {
                    setError("Type de fichier non supporté. Utilisez CSV, XLS ou XLSX.");
                    setIsProcessing(false); // On arrête le loader en cas d'erreur
                    return;
                }

                // --- Étapes finales communes à tous les fichiers valides ---

                setFullData(jsonData);
                if (jsonData.length > 0) {
                    setHeaders(Object.keys(jsonData[0]));
                } else {
                    setHeaders([]);
                    setError("Le fichier est vide ou son format est incorrect.");
                }
                setCurrentStep('view_data'); // On passe à l'étape suivante

            } catch (err) {
                console.error("Erreur lors de la lecture du fichier:", err);
                setError(`Erreur lors de la lecture du fichier.`);
            } finally {
                setIsProcessing(false); // On arrête le loader dans tous les cas (succès ou erreur)
            }
        };

        // On détermine comment lire le fichier en fonction de son type
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'xlsx' || extension === 'xls') {
            reader.readAsArrayBuffer(file); // Pour Excel
        } else {
            reader.readAsText(file); // Pour CSV et autres types de texte
        }
    };


    const resetFlow = (step: Step = 'select_campaign') => {
        setFullData([]);
        setHeaders([]);
        if (step === 'select_campaign') setSelectedCampaign(null);
        setCurrentStep(step);
        setError(null);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'select_campaign':
                return (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Choisissez une campagne de traitement</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Sélectionnez la campagne qui définit comment votre fichier sera traité.</p>
                        <div className="w-full max-w-md">
                            <select
                                id="campaign-selection"
                                value={selectedCampaign?.id || ""}
                                onChange={(e) => handleCampaignSelection(e.target.value)}
                                disabled={isLoading}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-lg"
                            >
                                <option value="">-- Sélectionnez une campagne --</option>
                                {campaigns.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name}
                                    </option>
                                ))}
                            </select>

                        </div>
                    </div>
                );

            case 'upload_file':
                return (
                    <div className="p-8">
                        <button onClick={() => resetFlow('select_campaign')} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Changer de campagne
                        </button>
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center">Importez votre fichier</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">Pour la campagne : <strong className="text-blue-600 dark:text-blue-400">{selectedCampaign?.name}</strong></p>
                        <div className="p-6 shadow-2xl dark:shadow-orange-500/20 rounded-lg flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                            <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Importer un Fichier CSV ou Excel</h4>
                            <DragDropZone onFileDrop={handleFileDrop} accept=".csv,.xlsx,.xls" />
                        </div>
                    </div>
                );

            case 'view_data':
                return (
                    <div className="flex flex-col h-full">
                        <div className="pt-2 space-y-6 pb-0 mb-6">
                            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Aperçu des données et traitement</h2>

                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                                    <button onClick={() => resetFlow('upload_file')} className="inline-flex text-white items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-medium rounded-md">
                                        <ChevronLeft className="h-4 w-4 mr-2" /> Changer de fichier
                                    </button>

                                </div>
                            </div>
                            {/* Champ pour le nom du fichier de sortie */}
                            <div className="w-full mb-6">
                                <div className='flex justify-between items-start w-full'>
                                    <div className="flex flex-col gap-y-3">
                                        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Fichier original
                                        </p>
                                        <span className="font-medium text-orange-600 dark:text-orange-400">{selectedFile?.name}</span>
                                    </div>
                                    <div className='flex gap-10 '>
                                        <div className='flex flex-col '>
                                            <label htmlFor="output-filename" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Nom du fichier de sortie
                                            </label>
                                            <div className="relative flex">
                                                <FileSignature className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    id="output-filename"
                                                    value={outputFileName}
                                                    onChange={(e) => setOutputFileName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="exemple_export.csv"
                                                />
                                            </div>
                                        </div>
                                        <div className='flex items-end'>
                                            <button
                                                onClick={handleProcessAndDownload}
                                                disabled={fullData.length === 0}
                                                className="inline-flex items-center justify-center p-2 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <Download className="h-5 w-5 mr-2" /> Traiter et télécharger
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto dark:border-gray-700 border-t">
                            <DataTable headers={headers} data={fullData} totalRowCount={fullData.length} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleProcessAndDownload = async () => {
        if (!selectedCampaign) {
            setError("Veuillez sélectionner une campagne pour le traitement.");
            return;
        }
        if (!outputFileName.trim()) {
            setError("Le nom du fichier de sortie ne peut pas être vide.");
            return;
        }

        try {
            // --- APPEL BACKEND RÉEL ---
            const response = await fileApi.processCSV(selectedFile, selectedCampaign.id);
            console.log(response);

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const finalFileName = outputFileName.endsWith('.csv') ? outputFileName : `${outputFileName}.csv`;
            link.download = finalFileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setUploadState({ isUploading: false, success: true, error: null, progress: 100 });

            setTimeout(() => {
                setSelectedFile(null);
                setUploadState({ isUploading: false, success: false, error: null, progress: 0 });
            }, 3000);

        } catch (error: any) {
            let errorMessage = 'Erreur lors du traitement du fichier.';
            if (error.response && error.response.data) {
                // Essayer de lire le message d'erreur du backend s'il est au format JSON
                try {
                    const errorJson = JSON.parse(await error.response.data.text());
                    if (errorJson.detail) errorMessage = errorJson.detail;
                } catch { }
            }
            const processedData = fullData.map(row => {
                const newRow: DataRow = {};
                selectedCampaign.columns.forEach(col => {
                    // Appliquer les règles ici si nécessaire
                    newRow[col.displayName] = row[col.name] || '';
                });
                return newRow;
            });

            const csv = Papa.unparse(processedData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);

            const finalFileName = outputFileName.endsWith('.csv') ? outputFileName : `${outputFileName}.csv`;
            link.setAttribute('download', finalFileName);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-20 sm:py-28 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-gray-800 bg-gradient-to-r from-white to-gray-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-gray-200 dark:border-blue-800 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Importation et Traitement de Fichier</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-300 text-lg">Suivez les étapes pour importer et préparer vos données.</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md transition-all duration-200 hover:shadow-lg"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Retour à l'accueil
                    </button>
                </div>
            </div>

            {error && <StatusMessage type="error" message={error} />}

            <div className="bg-white dark:bg-gray-800 bg-gradient-to-r from-white to-gray-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-gray-200 dark:border-blue-800 shadow-xl">
                <div className="p-6 border-b dark:border-gray-700 flex  justify-center">
                    <Stepper steps={IMPORT_STEPS} currentStep={currentStep} />
                </div>
                <div className="min-h-[400px] flex flex-col justify-center">
                    {isProcessing || isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400">{isLoading ? 'Chargement...' : 'Traitement...'}</span>
                        </div>
                    ) : renderStepContent()}
                </div>
            </div>
        </div>
    );
}

export default ImportPage;