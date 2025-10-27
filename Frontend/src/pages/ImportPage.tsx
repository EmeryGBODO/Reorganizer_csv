
import React, { useState, useEffect, useMemo } from 'react';
import { Download, ChevronLeft, CheckCircle, ChevronRight, FileSignature, RotateCcw, PieChart } from 'lucide-react';
import DragDropZone from '../components/DragDropZone';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import DataTable from '../components/DataTable';
import Stepper from '../components/Stepper';
import ConfirmModal from '../components/ConfirmModal';
import { Campaign, DataRow } from '../types';
import { campaignApi, fileApi } from '../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';

import DataFilterComponent, { CombinedFilters } from '../components/DataFilterComponent'; // <-- Nouvel import

const LOCAL_STORAGE_KEY = 'csvReorganizerSession_Import';

type Step = 'select_campaign' | 'upload_file' | 'view_data';

export interface UploadState {
    isUploading: boolean;
    success: boolean;
    error: string | null;
    progress: number;
}

// Interface pour l'état à sauvegarder
interface StoredState {
    currentStep: Step;
    selectedCampaignId: number | string | null;
    fullData: DataRow[];
    headers: string[];
    fileName: string | null;
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
    const [success, setSuccess] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState<Step>('select_campaign');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [fullData, setFullData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>({ isUploading: false, success: false, error: null, progress: 0 });
    const [outputFileName, setOutputFileName] = useState('');
    const [resetModal, setResetModal] = useState(false);
    const [isDataProcessed, setIsDataProcessed] = useState(false);
    const [downloadConfirmModal, setDownloadConfirmModal] = useState(false);
    const navigate = useNavigate();

    // --- NOUVEL ÉTAT POUR LES FILTRES ---
    const [activeFilters, setActiveFilters] = useState<CombinedFilters>({
        filter1: { column: '', value: '' },
        filter2: { column: '', value: '' },
    });
    // --- FIN NOUVEL ÉTAT ---

    // Chargement initial des données et de l'état sauvegardé
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                const campaignsRes = await campaignApi.getAll();
                const loadedCampaigns = campaignsRes.data || [];
                setCampaigns(loadedCampaigns);

                const savedStateJSON: StoredState | null = await localforage.getItem(LOCAL_STORAGE_KEY);

                if (savedStateJSON) {
                    setCurrentStep(savedStateJSON.currentStep);
                    setFullData(savedStateJSON.fullData);
                    setHeaders(savedStateJSON.headers);
                    if (savedStateJSON.fileName) {
                        // On ne peut pas recréer l'objet File, mais on peut garder son nom pour l'affichage
                        setSelectedFile(new File([], savedStateJSON.fileName));
                    }

                    if (savedStateJSON.selectedCampaignId) {
                        const campaign = loadedCampaigns.find(c => c.id === savedStateJSON.selectedCampaignId);
                        setSelectedCampaign(campaign || null);
                    }
                }
            } catch (err) {
                setError('Erreur lors du chargement des données initiales.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);



    // --- DONNÉES FILTRÉES ---
    const filteredData = useMemo(() => {
        // Si aucun filtre n'est actif, retourner toutes les données
        const f1Active = activeFilters.filter1.column && activeFilters.filter1.value;
        const f2Active = activeFilters.filter2.column && activeFilters.filter2.value;

        if (!f1Active && !f2Active) {
            return fullData;
        }

        const filter1Col = activeFilters.filter1.column;
        const filter1Val = activeFilters.filter1.value.toLowerCase();
        const filter2Col = activeFilters.filter2.column;
        const filter2Val = activeFilters.filter2.value.toLowerCase();

        return fullData.filter(row => {
            let match1 = true;
            let match2 = true;

            // Vérifier le filtre 1
            if (f1Active) {
                const rowValue = String(row[filter1Col] ?? '').toLowerCase();
                match1 = rowValue.includes(filter1Val);
            }

            // Vérifier le filtre 2
            if (f2Active) {
                const rowValue = String(row[filter2Col] ?? '').toLowerCase();
                match2 = rowValue.includes(filter2Val);
            }

            // Retourner vrai seulement si les deux filtres correspondent (ou ne sont pas actifs)
            return match1 && match2;
        });
    }, [fullData, activeFilters]);
    // --- FIN DONNÉES FILTRÉES ---


    // Configuration de LocalForage
    localforage.config({
        name: "CsvReorganizerApp",
        storeName: "importSession"
    });

    // Sauvegarde de l'état à chaque changement
    useEffect(() => {
        const saveState = async () => {
            if (!isLoading) {
                const stateToSave: StoredState = {
                    currentStep,
                    selectedCampaignId: selectedCampaign?.id || null,
                    fullData,
                    headers,
                    fileName: selectedFile?.name || null,
                };
                await localforage.setItem(LOCAL_STORAGE_KEY, stateToSave);
            }
        };
        saveState();
    }, [currentStep, selectedCampaign, fullData, headers, selectedFile, isLoading]);


    useEffect(() => {
        if (selectedCampaign) {
            let initialName = selectedCampaign.output_file_name || 'donnees_traitees.csv';
            // Remplacer les placeholders
            if (selectedFile) {
                initialName = initialName.replace('{nom_original}', selectedFile.name.split('.').slice(0, -1).join('.'));
            }
            setOutputFileName(initialName);
        }
    }, [selectedCampaign, selectedFile]);


    const handleCampaignSelection = (campaignId: string | number) => {
        const campaign = campaigns.find(c => c.id == campaignId);
        setSelectedCampaign(campaign || null);
        if (campaign) {
            setCurrentStep('upload_file');
        }
    };

    const handleFileDrop = (file: File) => {
        setIsProcessing(true);
        setError(null);
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target?.result;
                const extension = file.name.split('.').pop()?.toLowerCase();
                let jsonData: DataRow[] = [];

                if (extension === 'csv') {
                    const parsedData = Papa.parse(fileContent as string, {
                        header: true,
                        skipEmptyLines: true,
                        encoding: "UTF-8" // Spécifier l'encodage
                    });
                    jsonData = parsedData.data as DataRow[];
                } else if (extension === 'xlsx' || extension === 'xls') {
                    const data = new Uint8Array(fileContent as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    jsonData = XLSX.utils.sheet_to_json(firstSheet) as DataRow[];
                } else {
                    setError("Type de fichier non supporté. Utilisez CSV, XLS ou XLSX.");
                    setIsProcessing(false);
                    return;
                }

                setFullData(jsonData);
                if (jsonData.length > 0) {
                    setHeaders(Object.keys(jsonData[0]));
                } else {
                    setHeaders([]);
                    setError("Le fichier est vide ou son format est incorrect.");
                }
                setCurrentStep('view_data');
            } catch (err) {
                console.error("Erreur lors de la lecture du fichier:", err);
                setError(`Erreur lors de la lecture du fichier.`);
            } finally {
                setIsProcessing(false);
            }
        };

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'xlsx' || extension === 'xls') {
            reader.readAsArrayBuffer(file);
        } else {
            // Spécifier l'encodage UTF-8 pour la lecture
            reader.readAsText(file, "UTF-8");
        }
    };


    const resetFlow = (step: Step = 'select_campaign') => {
        setFullData([]);
        setHeaders([]);
        setSelectedFile(null);
        setIsDataProcessed(false);
        setActiveFilters({ // <-- Réinitialiser les filtres
            filter1: { column: '', value: '' },
            filter2: { column: '', value: '' },
        });
        if (step === 'select_campaign') setSelectedCampaign(null);
        setCurrentStep(step);
        setError(null);
    };

    const handleHardReset = () => {
        setResetModal(true);
    };

    const confirmHardReset = () => {
        localforage.removeItem(LOCAL_STORAGE_KEY).then(() => {
            setResetModal(false);
            resetFlow('select_campaign')
            setSelectedFile(null);
            setFullData([]);
            setHeaders([]);
            setOutputFileName('');
            setError(null);
            navigate('/');
        });
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
                            
                            <div className="w-full mb-6">
                                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 w-full'>
                                    <div className="flex flex-col gap-y-3">
                                        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Fichier original
                                        </p>
                                        <span className="font-medium text-orange-600 dark:text-orange-400 break-all">{selectedFile?.name}</span>
                                    </div>
                                    <div className='flex flex-col sm:flex-row gap-4 sm:gap-6'>
                                        <div className='flex flex-col flex-1'>
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
                                        <div className='flex items-end gap-2'>
                                            <button
                                                onClick={handleProcessAndDownload}
                                                disabled={fullData.length === 0}
                                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Traiter
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                disabled={fullData.length === 0}
                                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Télécharger
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* --- AJOUT DU COMPOSANT DE FILTRE --- */}
                            {headers.length > 0 && (
                                <DataFilterComponent
                                    headers={headers}
                                    onFilterChange={setActiveFilters}
                                    initialFilters={activeFilters} // Pour la persistance éventuelle
                                />
                            )}
                            {/* --- FIN AJOUT --- */}
                        <div className="flex-1 overflow-auto dark:border-gray-700 border-t">
                            {/* --- UTILISER filteredData ICI --- */}
                            <DataTable
                                headers={headers}
                                data={filteredData} // Utiliser les données filtrées
                                totalRowCount={filteredData.length} // Afficher le nombre de lignes filtrées
                            />
                            {/* --- FIN UTILISATION --- */}
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
        if (!selectedFile) {
            setError("Aucun fichier sélectionné. Veuillez retourner à l'étape précédente.");
            return;
        }

        try {
            const response = await fileApi.processCSV(selectedFile, selectedCampaign.id);
            console.log("response dans importpage", response);

            if (response && response?.error) {
                setError(response?.error)
                return;
            }

            if (response.data.length > 0) {
                setHeaders(Object.keys(response.data[0]));
            }
            setFullData(response?.data);
            setIsDataProcessed(true);

            setSuccess("Traitement effectué")

            setUploadState({ isUploading: false, success: true, error: null, progress: 100 });
            setTimeout(() => {
                setUploadState({ isUploading: false, success: false, error: null, progress: 0 });
            }, 3000);
        } catch (error: any) {
            setError(
                error?.response?.data?.detail ??
                "Une erreur est survenue pendant le traitement du fichier."
            );
        }
    };


    const handleDownload = () => {
        if (!isDataProcessed) {
            setDownloadConfirmModal(true);
            return;
        }
        handleDownloadDirect();
    };

    const handleDownloadDirect = async () => {
        if (!selectedCampaign) {
            return
        }
        try {
            const csvString = Papa.unparse(fullData, {
                delimiter: ',',
            });
            const filename = outputFileName.endsWith(".csv") ? outputFileName : `${outputFileName}.csv`;
            console.log("full data dans handle download", fullData);

            const returnedBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
            const downloadUrl = window.URL.createObjectURL(returnedBlob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            setSuccess("Le fichier a été téléchargé avec succès.")

        } catch (error) {
            setError("Une erreur s'est produite")
        }
    };

    const confirmDownloadWithoutProcessing = () => {
        setDownloadConfirmModal(false);
        handleDownloadDirect();
    };

    return (
        <div className="max-w-7xl mx-auto py-20 sm:py-28 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-gray-800 bg-gradient-to-r from-white to-gray-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-gray-200 dark:border-blue-800 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Importation et Traitement de Fichier</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-300 text-lg">Suivez les étapes pour importer et préparer vos données.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleHardReset}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md transition-all duration-200 hover:shadow-lg"
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Retour à l'accueil
                        </button>

                    </div>
                </div>
            </div>

            {error && (
                <StatusMessage type="error" message={error} className="mb-6" />
            )}
            {success && (
                <StatusMessage type="success" message={success} className="mb-6" />
            )}

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

            <ConfirmModal
                isOpen={resetModal}
                onClose={() => setResetModal(false)}
                onConfirm={confirmHardReset}
                title="Réinitialiser l'importation"
                message="Voulez-vous vraiment réinitialiser et effacer les données de la session en cours ?"
                confirmText="Réinitialiser"
                type="warning"
            />

            <ConfirmModal
                isOpen={downloadConfirmModal}
                onClose={() => setDownloadConfirmModal(false)}
                onConfirm={confirmDownloadWithoutProcessing}
                title="Télécharger sans traitement"
                message="Vous n'avez pas encore traité les données. Voulez-vous télécharger les données brutes ?"
                confirmText="Oui, télécharger"
                cancelText="Non, traiter d'abord"
                type="warning"
            />
        </div>
    );
}

export default ImportPage;