import React, { useState, useEffect, useMemo } from 'react';
import { Download, Server, Filter, ChevronLeft, ChevronRight, CheckCircle, RotateCcw, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import DataTable from '../components/DataTable';
import Filters from '../components/Filters';
import { Campaign, Agent, DataRow } from '../types';
import { campaignApi, dataApi } from '../services/api';

const PREVIEW_ROW_COUNT = 20;
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

const Stepper = ({ currentStep }: { currentStep: Step }) => {
  const steps = [
    { id: 'select_campaign', title: 'Choisir la Campagne' },
    { id: 'select_period', title: 'Définir la Période' },
    { id: 'view_data', title: 'Visualiser et Traiter' },
  ];
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);


  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.title} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-red-400" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-red-600 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-red-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-purple-600 rounded-full" aria-current="step">
                  <span className="h-2.5 w-2.5 bg-purple-600 rounded-full" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-red-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center bg-white border-2 border-purple-300 rounded-full">
                  <span className="h-2.5 w-2.5 bg-transparent rounded-full" aria-hidden="true" />
                </div>
              </>
            )}
            <span className="absolute top-10 w-max text-center text-xs text-gray-600">{step.title}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};


const EndUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [campaignsRes, agentsRes] = await Promise.all([
          campaignApi.getAll(),
          dataApi.getAgents(),
        ]);
        const loadedCampaigns = campaignsRes.data || [];
        setCampaigns(loadedCampaigns);
        setAgents(agentsRes.data.data || []);

        const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateJSON) {
          const savedState: StoredState = JSON.parse(savedStateJSON);
          setCurrentStep(savedState.currentStep);
          setFullData(savedState.fullData);
          setHeaders(savedState.headers);
          setServerDateRange(savedState.serverDateRange);
          setFilters(savedState.filters);

          if (savedState.selectedCampaignId) {
            const campaign = loadedCampaigns.find(c => c.id === savedState.selectedCampaignId);
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

  useEffect(() => {
    if (!isLoading) {
      const stateToSave: StoredState = {
        currentStep,
        selectedCampaignId: selectedCampaign?.id || null,
        fullData,
        headers,
        serverDateRange,
        filters,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [currentStep, selectedCampaign, fullData, headers, serverDateRange, filters, isLoading]);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
        selectedCampaign.id,
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
    } catch (err) {
      setError('Erreur lors de la récupération des données du serveur.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredData = useMemo(() => fullData.filter(row => !filters.agentId || row.agent === agents.find(a => a.id === filters.agentId)?.name), [fullData, filters, agents]);
  const dataPreview = useMemo(() => filteredData.slice(0, PREVIEW_ROW_COUNT), [filteredData]);

  const handleProcessAndDownload = () => {
    if (!selectedCampaign?.id) {
      setError("Veuillez sélectionner une campagne pour le traitement.");
      return;
    }
    const processingCampaign = campaigns.find(c => c.id === filters.processingCampaignId);
    if (!processingCampaign) {
      setError("Campagne de traitement non valide.");
      return;
    }
    const processedData = filteredData.map(row => {
      const newRow: DataRow = {};
      processingCampaign.columns.forEach(col => {
        newRow[col.displayName] = row[col.name] || '';
      });
      return newRow;
    });
    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'donnees_traitees.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFlow = (step: Step = 'select_campaign') => {
    setFullData([]);
    setHeaders([]);
    if (step === 'select_campaign') setSelectedCampaign(null);
    setCurrentStep(step);
    setError(null);
  };

  const handleHardReset = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser et effacer toutes les données en cours ?")) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
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
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select_campaign':
        return (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Choisissez une campagne</h3>
            <p className="text-gray-600 mb-6">Sélectionnez la campagne pour générer des données depuis le serveur.</p>
            <div className="w-full max-w-md space-y-4 ">
              <select
                id="campaign-selection"
                value={selectedCampaign?.id || ""}
                onChange={(e) => handleCampaignSelection(e.target.value)}
                disabled={isLoading}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-lg"
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
            <button onClick={() => resetFlow('select_campaign')} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </button>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Générer depuis le Serveur</h3>
            <p className="text-gray-600 mb-6 text-center">Pour la campagne : <strong className="text-purple-600">{selectedCampaign?.name}</strong></p>
            <div className="p-6 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow space-y-4 max-w-lg mx-auto">
              <div className="w-full space-y-3">
                  <label className="block text-sm font-medium text-gray-700 text-left">
                      Période requise *
                  </label>
                  <div className="flex items-center space-x-2">
                      <input
                          type="date"
                          value={serverDateRange.start}
                          onChange={(e) => setServerDateRange(d => ({ ...d, start: e.target.value }))}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                          type="date"
                          value={serverDateRange.end}
                          onChange={(e) => setServerDateRange(d => ({ ...d, end: e.target.value }))}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                  </div>
                  {dateError && <p className="text-xs text-red-600 mt-1">{dateError}</p>}
              </div>
              <button
                onClick={handleGenerateFromServer}
                disabled={isProcessing || !serverDateRange.start || !serverDateRange.end || !!dateError}
                className="w-fit inline-flex items-center justify-center p-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500
 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Server className="h-5 w-5 mr-2" /> Charger les données
              </button>
            </div>
          </div>
        );

      case 'view_data':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Affinez et traitez les données</h2>
              <button onClick={() => resetFlow('select_period')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4 mr-2" /> Changer de période
              </button>
            </div>
            <Filters
              campaigns={campaigns}
              agents={agents}
              selectedCampaignId={filters.processingCampaignId}
              onCampaignChange={(id) => setFilters(f => ({ ...f, processingCampaignId: id }))}
              onAgentChange={(id) => setFilters(f => ({ ...f, agentId: id }))}
              dateRange={filters.dateRange}
              onDateChange={(dates) => {
                setFilters(f => {
                    const newDateRange = {
                        start: dates.start || f.dateRange.start, 
                        end: dates.end || f.dateRange.end 
                    };
                    return { ...f, dateRange: newDateRange };
                });
              }}
              disabled={isProcessing}
            />
            <div className="border-t pt-6">
              <DataTable headers={headers} data={dataPreview} totalRowCount={filteredData.length} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleProcessAndDownload}
                  disabled={filteredData.length === 0 || !filters.processingCampaignId}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Download className="h-5 w-5 mr-2" /> Traiter et Télécharger ({filteredData.length} lignes)
                </button>
              </div>
            </div>
          </div>
        );
      default:y
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 ">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord de Traitement</h1>
            <p className="mt-2 text-lg text-gray-600">Générez des rapports depuis le serveur en suivant les étapes ci-dessous.</p>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => navigate('/import')}
                className="inline-flex items-center px-3 py-2 text-white border text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-bold rounded-xl shadow-lg"
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

      {error && <StatusMessage type="error" message={error} />}

      <div className="bg-white shadow-xl rounded-lg ">
        <div className="p-6 border-b flex justify-center">
          <Stepper currentStep={currentStep} />
        </div>
        <div className="min-h-[400px] flex flex-col justify-center">
          {isProcessing || isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">{isLoading ? 'Chargement des données...' : 'Traitement en cours...'}</span>
            </div>
          ) : renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default EndUserPage;