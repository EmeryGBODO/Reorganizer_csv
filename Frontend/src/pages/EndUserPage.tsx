import React, { useState, useEffect, useMemo } from 'react';
import { Download, UploadCloud, Server, Filter, X } from 'lucide-react';
import DragDropZone from '../components/DragDropZone';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import DataTable from '../components/DataTable';
import Filters from '../components/Filters';
import { Campaign, Agent, DataRow } from '../types';
import { campaignApi, dataApi } from '../services/api';
import Papa from 'papaparse'; // Pour lire les fichiers CSV

const EndUserPage: React.FC = () => {
  // State de base
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // State de chargement et d'erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State des filtres
  const [filters, setFilters] = useState({
    campaignId: '',
    agentId: '',
    dateRange: { start: '', end: '' },
  });

  // Logique d'initialisation
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [campaignsRes, agentsRes] = await Promise.all([
          campaignApi.getAll(),
          dataApi.getAgents(),
        ]);
        setCampaigns(campaignsRes.data.data);
        setAgents(agentsRes.data.data);
      } catch (err) {
        setError('Erreur lors du chargement des données initiales.');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);
  
  // Gestion du fichier importé
  const handleFileDrop = (file: File) => {
    setIsLoading(true);
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data as DataRow[]);
        if (results.data.length > 0) {
            setHeaders(Object.keys(results.data[0]));
        }
        setIsLoading(false);
      },
      error: (err) => {
        setError(`Erreur lors de la lecture du fichier CSV: ${err.message}`);
        setIsLoading(false);
      }
    });
  };

  // Gestion de la génération de données serveur
  const handleGenerateFromServer = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await dataApi.generateDataFromServer({ startDate: '2023-01-01', endDate: '2023-12-31' }); // Dates en dur pour l'exemple
        setData(response.data.data);
        if (response.data.data.length > 0) {
            setHeaders(Object.keys(response.data.data[0]));
        }
    } catch (err) {
        setError('Erreur lors de la récupération des données du serveur.');
    } finally {
        setIsLoading(false);
    }
  };

  // Logique de filtrage des données
  const filteredData = useMemo(() => {
    return data.filter(row => {
        // Logique de filtre (simplifiée pour l'exemple)
        const agentMatch = !filters.agentId || row.agentId === filters.agentId;
        const campaignMatch = !filters.campaignId; // La logique de campagne est plus complexe, à implémenter
        return agentMatch && campaignMatch;
    });
  }, [data, filters]);

  const handleProcessAndDownload = () => {
    if (!filters.campaignId) {
        setError("Veuillez sélectionner une campagne pour traiter les données.");
        return;
    }
    setError(null);
    
    const selectedCampaign = campaigns.find(c => c.id === filters.campaignId);
    if (!selectedCampaign) {
        setError("Campagne sélectionnée non valide.");
        return;
    }

    // 1. Appliquer les règles de la campagne (logique à développer)
    const processedData = filteredData.map(row => {
        const newRow: DataRow = {};
        // Exemple simple : on ne garde que les colonnes de la campagne
        selectedCampaign.columns.forEach(col => {
            newRow[col.displayName] = row[col.name] || ''; // Logique de mapping à affiner
        });
        return newRow;
    });

    // 2. Convertir en CSV et télécharger
    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'donnees_traitees.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const clearData = () => {
      setData([]);
      setHeaders([]);
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord de Traitement</h1>
        <p className="mt-2 text-lg text-gray-600">
          Importez ou générez des données, filtrez-les et appliquez les règles de vos campagnes.
        </p>
      </div>

      {error && <StatusMessage type="error" message={error} />}

      {/* Section principale : affichage des données ou des options d'import */}
      <div className="bg-white shadow-xl rounded-lg">
        {data.length === 0 && !isLoading ? (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Importer un Fichier</h3>
                    <DragDropZone onFileDrop={handleFileDrop} accept=".csv,.xlsx,.xls" />
                </div>
                <div className="p-6 border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Générer depuis le Serveur</h3>
                    <button
                        onClick={handleGenerateFromServer}
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                    >
                        <Server className="h-12 w-12 text-gray-400 mb-4" />
                        <span className="text-lg font-medium text-gray-700">Charger les données du serveur</span>
                        <span className="text-sm text-gray-500 mt-1">Récupérer les derniers rapports</span>
                    </button>
                </div>
            </div>
        ) : (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Filter className="h-6 w-6 text-gray-500" />
                        <h2 className="text-xl font-semibold text-gray-900">Filtrer les données</h2>
                    </div>
                    <button
                        onClick={clearData}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Changer de source
                    </button>
                </div>

                <Filters
                    campaigns={campaigns}
                    agents={agents}
                    selectedCampaignId={filters.campaignId}
                    onCampaignChange={(id) => setFilters(f => ({...f, campaignId: id}))}
                    onAgentChange={(id) => setFilters(f => ({...f, agentId: id}))}
                    onDateChange={(dates) => setFilters(f => ({...f, dateRange: dates}))}
                    disabled={isLoading}
                />
                
                <div className="border-t pt-6">
                    {isLoading ? (
                         <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                            <span className="ml-3 text-gray-600">Chargement des données...</span>
                        </div>
                    ) : (
                        <>
                            <DataTable headers={headers} data={filteredData} />
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleProcessAndDownload}
                                    disabled={!filters.campaignId || filteredData.length === 0}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    Traiter et Télécharger
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default EndUserPage;