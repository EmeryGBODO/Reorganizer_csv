import React, { useState, useEffect, useMemo } from 'react';
import { Download, UploadCloud, Server, Filter, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import DragDropZone from '../components/DragDropZone';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import DataTable from '../components/DataTable';
import Filters from '../components/Filters';
import { Campaign, Agent, DataRow } from '../types';
import { campaignApi, dataApi } from '../services/api';
import Papa from 'papaparse';

const PREVIEW_ROW_COUNT = 20;

type Step = 'select_campaign' | 'select_source' | 'view_data';

const Stepper = ({ currentStep }: { currentStep: Step }) => {
  const steps = [
    { id: 'select_campaign', title: 'Choisir la Campagne' },
    { id: 'select_source', title: 'Choisir la Source' },
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
                  <div className="h-0.5 w-full bg-blue-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-blue-600 rounded-full hover:bg-blue-900">
                  <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-blue-600 rounded-full" aria-current="step">
                  <span className="h-2.5 w-2.5 bg-blue-600 rounded-full" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:border-gray-400">
                  <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300" aria-hidden="true" />
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
  const [currentStep, setCurrentStep] = useState<Step>('select_campaign');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [fullData, setFullData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
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
        setCampaigns(campaignsRes.data || []);
        setAgents(agentsRes.data.data || []);
      } catch (err) {
        setError('Erreur lors du chargement des données initiales.');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);


    
  useEffect(() => {
    // 1. On vérifie s'il y a un message d'erreur actif
    if (error) {
      // 2. On démarre un chronomètre (par exemple, 5000 millisecondes = 5 secondes)
      const timer = setTimeout(() => {
        // 3. À la fin du temps, on réinitialise l'état 'error' à null
        setError(null); 
      }, 5000); 
  
      // 4. Fonction de nettoyage : Elle est cruciale !
      // Si l'utilisateur clique rapidement sur quelque chose d'autre,
      // on annule le timer précédent pour éviter les bugs.
      return () => clearTimeout(timer);
    }
  }, [error]); // Le tableau de dépendances : ce code s'exécute à chaque fois que 'error' change.

  const handleCampaignSelection = (campaignId: number | string) => {
    console.log("Campagne id à vérifier",campaignId);
    
    const campaign = campaigns.filter(c => c.id == campaignId)[0];
    
    console.log("Campagne à vérifier",campaign);
    setSelectedCampaign(campaign || null);
    setError(null);
  };

  const handleFileDrop = (file: File) => {
    setIsProcessing(true);
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFullData(results.data as DataRow[]);
        if (results.data.length > 0) setHeaders(Object.keys(results.data[0]));
        setIsProcessing(false);
        setCurrentStep('view_data');
      },
      error: (err) => {
        setError(`Erreur lors de la lecture du fichier CSV: ${err.message}`);
        setIsProcessing(false);
      },
    });
  };

  const handleGenerateFromServer = async () => {
    if (!selectedCampaign) return;
    setIsProcessing(true);
    setError(null);
    try {
      const response = await dataApi.generateDataFromServer(selectedCampaign.id);
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
    if (!selectedCampaign.id) {
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select_campaign':
        return (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Choisissez une campagne</h3>
            <p className="text-gray-600 mb-6">Sélectionnez la campagne à utiliser pour charger et traiter vos données.</p>
            <div className="w-full max-w-md space-y-4">
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
                onClick={() => setCurrentStep('select_source')}
                disabled={!selectedCampaign}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continuer <ChevronRight className="h-5 w-5 ml-2" />
              </button>
            </div>
            {isLoading && <p className="mt-4 text-sm text-gray-500">Chargement des campagnes...</p>}
          </div>
        );

      case 'select_source':
        return (
          <div className="p-8">
            <button onClick={() => resetFlow('select_campaign')} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </button>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Choisissez une source de données</h3>
            <p className="text-gray-600 mb-6 text-center">Pour la campagne : <strong className="text-blue-600">{selectedCampaign?.name}</strong></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Importer un Fichier</h4>
                <DragDropZone onFileDrop={handleFileDrop} accept=".csv,.xlsx,.xls" />
              </div>
              <div className="p-6 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow space-y-4">
                <h4 className="text-xl font-semibold text-gray-800">Générer depuis le Serveur</h4>
                <button
                  onClick={handleGenerateFromServer}
                  disabled={isProcessing}
                  className="w-fit inline-flex items-center justify-center p-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Server className="h-5 w-5 mr-2" /> Charger les données
                </button>
              </div>
            </div>
          </div>
        );

      case 'view_data':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Affinez et traitez les données</h2>
              <button onClick={() => resetFlow('select_source')} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4 mr-2" /> Changer de source
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
                
                console.log("1. Dates reçues de Filters:", dates); 
                
                
                setFilters(f => {
                    const newDateRange = {
                        start: dates.start || f.dateRange.start, 
                        end: dates.end || f.dateRange.end 
                    };
                    console.log("2. Nouvel État de dateRange APRES fusion:", newDateRange);
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
                  disabled={
                    // !filters.processingCampaignId || 
                    filteredData.length === 0 ||
                    !filters.dateRange.start || 
                    !filters.dateRange.end   
                  }                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Download className="h-5 w-5 mr-2" /> Traiter et Télécharger ({filteredData.length} lignes)
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 ">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord de Traitement</h1>
        <p className="mt-2 text-lg text-gray-600">Suivez les étapes pour préparer et exporter vos données.</p>
      </div>

      {error && <StatusMessage type="error" message={error} />}

      <div className="bg-white shadow-xl rounded-lg ">
        <div className="p-6 border-b flex justify-center">
          <Stepper currentStep={currentStep} />
        </div>
        <div className="min-h-[400px] flex flex-col justify-center">
          {isProcessing ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Traitement en cours...</span>
            </div>
          ) : renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default EndUserPage;