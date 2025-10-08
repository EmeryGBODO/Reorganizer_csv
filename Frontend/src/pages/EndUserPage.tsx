import React, { useState, useEffect } from 'react';
import { Download, Trash } from 'lucide-react';
import * as XLSX from 'xlsx';
import DragDropZone from '../components/DragDropZone';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import { Campaign, UploadState } from '../types';
import { campaignApi, fileApi } from '../services/api';

const EndUserPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFilename, setOutputFilename] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    success: false,
    error: null,
    progress: 0,
  });
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);
  
  const parseFilename = (template: string, originalName: string) => {
    const date = new Date();
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return template
      .replace(/__{nom_original}__/g, originalName.replace(/\.(csv|xlsx|xls)$/i, ''))
      .replace(/__{date}__/g, dateString);
  };

  useEffect(() => {
    if (selectedCampaignId && selectedFile) {
      const campaign = campaigns.find(c => c.uuid === selectedCampaignId);
      if (campaign && campaign.outputFilenameTemplate) {
        setOutputFilename(parseFilename(campaign.outputFilenameTemplate, selectedFile.name));
      }
    } else {
      setOutputFilename('');
    }
  }, [selectedCampaignId, selectedFile, campaigns]);

  const handleDelete = () => {
    setSelectedFile(null);
    setUploadState({ isUploading: false, success: false, error: null, progress: 0 });
  };

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      // Remplacé par le vrai appel API
      const response = await campaignApi.getAll();
      setCampaigns(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      setUploadState(prev => ({ ...prev, error: "Impossible de charger les campagnes depuis le serveur."}));
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleFileDrop = (file: File) => {
    setUploadState({ isUploading: false, success: false, error: null, progress: 0 });
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      setSelectedFile(file);
      return;
    }

    if (extension === 'xlsx' || extension === 'xls') {
      setIsConverting(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvData = XLSX.utils.sheet_to_csv(worksheet);
          
          const newFileName = file.name.replace(/\.(xlsx|xls)$/i, '.csv');
          const csvFile = new File([csvData], newFileName, { type: 'text/csv' });
          
          setSelectedFile(csvFile);
        } catch (err) {
            setUploadState(prev => ({ ...prev, error: "Erreur lors de la conversion du fichier Excel."}));
        } finally {
            setIsConverting(false);
        }
      };
      reader.onerror = () => {
        setUploadState(prev => ({ ...prev, error: "Impossible de lire le fichier."}));
        setIsConverting(false);
      }
      reader.readAsArrayBuffer(file);
      return;
    }

    setUploadState(prev => ({ ...prev, error: "Type de fichier non supporté."}));
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !selectedCampaignId) {
      setUploadState(prev => ({ ...prev, error: 'Veuillez sélectionner une campagne et un fichier CSV' }));
      return;
    }
    if (!outputFilename.trim()) {
      setUploadState(prev => ({ ...prev, error: 'Le nom du fichier de sortie ne peut pas être vide.' }));
      return;
    }

    setUploadState({ isUploading: true, success: false, error: null, progress: 0 });

    try {
      // --- APPEL BACKEND RÉEL ---
      const response = await fileApi.processCSV(selectedFile, selectedCampaignId);
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = outputFilename.endsWith('.csv') ? outputFilename : `${outputFilename}.csv`;
      
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
            if(errorJson.detail) errorMessage = errorJson.detail;
        } catch {}
      }
      setUploadState({ isUploading: false, success: false, error: errorMessage, progress: 0 });
    }
  };

  const selectedCampaign = campaigns.find(c => c.uuid === selectedCampaignId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Traitement de fichier</h1>
        <p className="text-lg text-gray-600">Sélectionnez une campagne, uploadez votre fichier (CSV ou Excel) et lancez le traitement.</p>
      </div>

      <div className="space-y-6">
       {/* Sélection de campagne */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Sélectionnez une campagne
          </h2>
          
          {loadingCampaigns ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Chargement des campagnes...</span>
            </div>
          ) : (
            <div>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={uploadState.isUploading}
              >
                <option value="">Choisir une campagne...</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.uuid} value={campaign.uuid}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              {selectedCampaign && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Description:</strong> {selectedCampaign.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Uploadez votre fichier</h2>
          <DragDropZone onFileDrop={handleFileDrop} disabled={!selectedCampaignId || uploadState.isUploading || isConverting} />
          
          {isConverting && (
            <div className="mt-4 flex items-center justify-center text-gray-600">
              <LoadingSpinner />
              <span className="ml-2">Conversion du fichier Excel en cours...</span>
            </div>
          )}

          {selectedFile && !isConverting && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                {!uploadState.isUploading && !uploadState.success && (
                  <div className='flex gap-2'>
                    <button onClick={handleDelete} title="Supprimer le fichier"><Trash className="h-5 w-5 opacity-60 hover:text-red-600 hover:opacity-100 "/></button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {selectedFile && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Nom du fichier de sortie</h2>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                disabled={uploadState.isUploading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleProcessFile}
                disabled={!selectedCampaignId || uploadState.isUploading}
                title='Traiter et télécharger'
                className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {(uploadState.isUploading || uploadState.success || uploadState.error) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">État du traitement</h2>
            {uploadState.isUploading && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3"><LoadingSpinner /><span className="text-gray-700">Traitement en cours... {uploadState.progress}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadState.progress}%` }} /></div>
              </div>
            )}
            {uploadState.success && <StatusMessage type="success" message="Fichier traité ! Le téléchargement a commencé." />}
            {uploadState.error && <StatusMessage type="error" message={uploadState.error} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default EndUserPage;