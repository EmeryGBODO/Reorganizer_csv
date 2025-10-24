import React, { useState, useEffect, useMemo } from 'react';
import { Download, Server, Filter, ChevronLeft, ChevronRight, CheckCircle, RotateCcw, Upload, FileSignature } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import DataTable from '../components/DataTable';
import Filters from '../components/Filters';
import Stepper from '../components/Stepper';
import ConfirmModal from '../components/ConfirmModal';
import { Campaign, Agent, DataRow } from '../types';
import { campaignApi, dataApi, fileApi } from '../services/api';
import Papa from "papaparse";
import localforage from "localforage";

const LOCAL_STORAGE_KEY = 'csvReorganizerSession_EndUser'; // Clé de stockage modifiée

type Step = 'select_campaign' | 'select_period' | 'view_data';

interface StoredState {
    currentStep: Step;
    selectedCampaignId: number | string | null;
    fullData: DataRow[];
    headers: string[];
    serverDateRange: { start: string; end: string };
    filters: {
        processingCampaignId: string;
        agentId: string;
        dateRange: { start: string; end: string };
    };
}

const ENDUSER_STEPS = [
    { id: 'select_campaign', title: 'Choisir la Campagne' },
    { id: 'select_period', title: 'Définir la Période' },
    { id: 'view_data', title: 'Visualiser et Traiter' },
];

const EndUserPage: React.FC = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dateError, setDateError] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState<Step>('select_campaign');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [fullData, setFullData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [serverDateRange, setServerDateRange] = useState({ start: '', end: '' });
    const [filters, setFilters] = useState({
        processingCampaignId: '',
        agentId: '',
        dateRange: { start: '', end: '' },
    });
    const [resetModal, setResetModal] = useState(false);
    const [outputFileName, setOutputFileName] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                const [campaignsRes] = await Promise.all([
                    campaignApi.getAll(),
                ]);
                const loadedCampaigns = campaignsRes.data || [];
                setCampaigns(loadedCampaigns);

                const savedStateJSON: StoredState | null = await localforage.getItem(LOCAL_STORAGE_KEY);

                if (savedStateJSON) {
                    setCurrentStep(savedStateJSON.currentStep);
                    setFullData(savedStateJSON.fullData);
                    setHeaders(savedStateJSON.headers);
                    setServerDateRange(savedStateJSON.serverDateRange);
                    setFilters(savedStateJSON.filters);

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


    localforage.config({
        name: "CsvReorganizerApp",
        storeName: "userData"
    });

    useEffect(() => {
        const saveState = async () => {
            if (!isLoading) {
                const stateToSave: StoredState = {
                    currentStep,
                    selectedCampaignId: selectedCampaign?.id || null,
                    fullData,
                    headers,
                    serverDateRange,
                    filters,
                };

                await localforage.setItem(LOCAL_STORAGE_KEY, stateToSave);
            }
        };

        saveState();
    }, [currentStep, selectedCampaign?.id, fullData, headers, serverDateRange, filters, isLoading]);

    useEffect(() => {
        if (selectedCampaign) {
            // Initialiser le nom du fichier de sortie quand une campagne est sélectionnée
            setOutputFileName(selectedCampaign.output_file_name || 'donnees_traitees.csv');
        }
    }, [selectedCampaign]);


    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);
    
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (serverDateRange.start && serverDateRange.end) {
            const startDate = new Date(serverDateRange.start);
            const endDate = new Date(serverDateRange.end);
            if (endDate < startDate) {
                setDateError("La date de fin doit être supérieure ou égale à la date de début.");
            } else {
                setDateError(null);
            }
        } else {
            setDateError(null);
        }
    }, [serverDateRange]);

    const handleCampaignSelection = (campaignId: string | number) => {
        const campaign = campaigns.find(c => c.id == campaignId);
        setSelectedCampaign(campaign || null);
        setError(null);
    };

    const handleGenerateFromServer = async () => {
        if (dateError) {
            setError(dateError);
            return;
        }
        if (!selectedCampaign || !serverDateRange.start || !serverDateRange.end) {
            setError("Veuillez sélectionner une campagne et une période complète.");
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const response = await dataApi.generateDataFromServer(
                serverDateRange.start,
                serverDateRange.end
            );

            setFullData(response.data.data);
            if (response.data.data.length > 0) {
                setHeaders(Object.keys(response.data.data[0]));
            } else {
                setHeaders([]);
            }
            setCurrentStep('view_data');
            setSuccess("Les données ont été récupérées avec succès.")
        } catch (err) {
            setError('Erreur lors de la récupération des données du serveur.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleProcess = async () => {
        if (!selectedCampaign) {
            setError("Aucune campagne n'est sélectionnée. Veuillez recommencer le processus.");
            return;
        }
        if (!outputFileName.trim()) {
            setError("Le nom du fichier de sortie ne peut pas être vide.");
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);

            const csvString = Papa.unparse(fullData, {
                delimiter: ';',
            });

            const filename = outputFileName.endsWith(".csv") ? outputFileName : `${outputFileName}.csv`;
            const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            const csvFile = new File([csvBlob], filename, { type: "text/csv;charset=utf-8;" });

            const response = await fileApi.processCSV(
                csvFile,
                +selectedCampaign.id
            );
            console.log("response reçu", response);

            if (response && response?.error) {
                setError(response?.error)
                return;
            }
            setFullData(response.data);
            setSuccess("Le fichier a été traité avec succès.")
        } catch (err: any) {
            console.error("Erreur lors du traitement et téléchargement : ", err);
            setError(
                err?.response?.data?.detail ??
                "Une erreur est survenue pendant le traitement du fichier."
            );
        } finally {
            setIsProcessing(false);
        }
    };


    const handleDownload = async () => {
        if (!selectedCampaign) {
            return
        }
        try {
            const csvString = Papa.unparse(fullData, {
                delimiter: ';',
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

    }

    const resetFlow = (step: Step = 'select_campaign') => {
        setFullData([]);
        setHeaders([]);
        if (step === 'select_campaign') setSelectedCampaign(null);
        setCurrentStep(step);
        setError(null);
    };

    const handleHardReset = () => {
        setResetModal(true);
    };

    const confirmHardReset = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setResetModal(false); // Fermer la modale
        setCurrentStep('select_campaign');
        setSelectedCampaign(null);
        setFullData([]);
        setHeaders([]);
        setServerDateRange({ start: '', end: '' });
        setFilters({
            processingCampaignId: '',
            agentId: '',
            dateRange: { start: '', end: '' },
        });
        setError(null);
        setDateError(null);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'select_campaign':
                return (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Choisissez une campagne</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Sélectionnez la campagne pour générer des données depuis le serveur.</p>
                        <div className="w-full max-w-md space-y-4 ">
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
                            <button
                                onClick={() => setCurrentStep('select_period')}
                                disabled={!selectedCampaign}
                                className="w-full inline-flex items-center justify-center px-6 py-3 font-medium rounded-md text-white  bg-gradient-to-r from-orange-500 to-red-500 hover:to-red-600 disabled:bg-purple-400 disabled:cursor-not-allowed"
                            >
                                Continuer <ChevronRight className="h-5 w-5 ml-2" />
                            </button>
                        </div>
                    </div>
                );

            case 'select_period':
                return (
                    <div className="p-8 ">
                        <button onClick={() => resetFlow('select_campaign')} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                        </button>
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center">Générer depuis le Serveur</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">Pour la campagne : <strong className="text-blue-600 dark:text-blue-400">{selectedCampaign?.name}</strong></p>
                        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow space-y-4 max-w-lg mx-auto">
                            <div className="w-full space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                                    Période requise *
                                </label>
                                <div className="flex items-center space-x-2 ">
                                    <input
                                        type="date"
                                        value={serverDateRange.start}
                                        onChange={(e) => setServerDateRange(d => ({ ...d, start: e.target.value }))}
                                        className="w-full p-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="text-gray-500 dark:text-gray-400">-</span>
                                    <input
                                        type="date"
                                        value={serverDateRange.end}
                                        onChange={(e) => setServerDateRange(d => ({ ...d, end: e.target.value }))}
                                        className="w-full p-3 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                {dateError && <p className="text-xs text-red-600 mt-1">{dateError}</p>}
                            </div>
                            <button
                                onClick={handleGenerateFromServer}
                                disabled={isProcessing || !serverDateRange.start || !serverDateRange.end || !!dateError}
                                className="w-fit inline-flex items-center justify-center p-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Server className="h-5 w-5 mr-2" /> Charger les données
                            </button>
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
                                    <button onClick={() => resetFlow('select_period')} className="inline-flex text-white items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-medium rounded-md">
                                        <ChevronLeft className="h-4 w-4 mr-2" /> Changer de période
                                    </button>
                                </div>
                            </div>
                            {/* Champ pour le nom du fichier de sortie */}
                            <div className="w-full mb-6">
                                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 w-full'>
                                    <div className="flex flex-col gap-y-3">
                                        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Campagne appliquée
                                        </p>
                                        <span className="font-medium text-orange-600 dark:text-orange-400">{selectedCampaign?.name}</span>
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
                                        <div className='flex items-end'>
                                            <button
                                                onClick={handleProcess}
                                                disabled={isProcessing || fullData.length === 0}
                                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Traiter
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                disabled={isProcessing || fullData.length === 0}
                                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Télécharger
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto dark:border-gray-700 border-t">
                            <DataTable
                                headers={headers}
                                data={fullData}
                                totalRowCount={fullData.length}
                                columns={selectedCampaign?.columns || []}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-20 sm:py-28 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-gray-800 bg-gradient-to-r from-white to-gray-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-gray-200 dark:border-blue-800 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tableau de Bord de Traitement</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Générez des rapports depuis le serveur en suivant les étapes ci-dessous.</p>
                    </div>
                    <div className="flex px-4 items-center space-x-2">
                        <button
                            onClick={() => navigate('/import')}
                            className="inline-flex items-center  px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md transition-all duration-200 hover:shadow-lg"
                            title="Importer un fichier"
                        >
                            <Upload className="h-4 w-4 mr-2" /> Importer un Fichier
                        </button>
                        <button
                            onClick={handleHardReset}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-red-700"
                            title="Réinitialiser la session"
                        >
                            <RotateCcw className="h-4 w-4" />
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
                <div className="p-6 border-b flex dark:border-gray-700 justify-center">
                    <Stepper steps={ENDUSER_STEPS} currentStep={currentStep} />
                </div>
                <div className="min-h-[400px] flex flex-col justify-center">
                    {isProcessing || isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400">{isLoading ? 'Chargement des données...' : 'Traitement en cours...'}</span>
                        </div>
                    ) : renderStepContent()}
                </div>
            </div>

            <ConfirmModal
                isOpen={resetModal}
                onClose={() => setResetModal(false)}
                onConfirm={confirmHardReset}
                title="Recommencer"
                message="Voulez-vous vraiment réinitialiser et effacer toutes les données en cours ?"
                confirmText="Recommencer"
                type="warning"
            />
        </div>
    );
};

export default EndUserPage;