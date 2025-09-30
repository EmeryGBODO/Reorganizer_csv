import React, { useState, useEffect } from 'react';
import { Download, Trash } from 'lucide-react';
import DragDropZone from '../components/DragDropZone';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import { Campaign, UploadState } from '../types';
import { campaignApi, fileApi } from '../services/api';

const EndUserPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleDelete = async () => {
    setSelectedFile(null);
    setUploadState({
      isUploading: false,
      success: false,
      error: null,
      progress: 0,
    });
  }

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const response = await campaignApi.getAll();
      setCampaigns(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleFileDrop = (file: File) => {
    setSelectedFile(file);
    setUploadState({
      isUploading: false,
      success: false,
      error: null,
      progress: 0,
    });
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !selectedCampaignId) {
      setUploadState(prev => ({
        ...prev,
        error: 'Veuillez sélectionner une campagne et un fichier CSV',
      }));
      return;
    }

    setUploadState({
      isUploading: true,
      success: false,
      error: null,
      progress: 0,
    });

    try {
      // Simulation du processus de traitement
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadState(prev => ({ ...prev, progress }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Appel API réel (commenté car le backend n'existe pas encore)
      // const response = await fileApi.processCSV(selectedFile, selectedCampaignId);
      
      // Simulation du téléchargement du résultat
      const blob = new Blob(['nom,email,age\nJean Dupont,jean@example.com,30'], { 
        type: 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `processed_${selectedFile.name}`;
      link.click();
      window.URL.revokeObjectURL(url);

      setUploadState({
        isUploading: false,
        success: true,
        error: null,
        progress: 100,
      });

      // Reset après succès
      setTimeout(() => {
        setSelectedFile(null);
        setUploadState({
          isUploading: false,
          success: false,
          error: null,
          progress: 0,
        });
      }, 3000);

    } catch (error) {
      setUploadState({
        isUploading: false,
        success: false,
        error: 'Erreur lors du traitement du fichier' + error,
        progress: 0,
      });
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Traitement de fichier CSV
        </h1>
        <p className="text-lg text-gray-600">
          Sélectionnez une campagne et uploadez votre fichier CSV pour le réorganiser selon vos paramètres.
        </p>
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
                  <option key={campaign.id} value={campaign.id}>
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

        {/* Upload de fichier */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. Uploadez votre fichier CSV
          </h2>
          
          <DragDropZone
            onFileDrop={handleFileDrop}
            disabled={!selectedCampaignId || uploadState.isUploading}
          />
          
          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {!uploadState.isUploading && !uploadState.success && (
                  <div className='flex gap-2'>
                    <button onClick={handleDelete}>
                      <Trash className="h-5 w-5 opacity-60 hover:text-red-600 hover:opacity-100 "/>
                    </button>
                    <button
                      onClick={handleProcessFile}
                      disabled={!selectedCampaignId}
                      title='Traiter le fichier'
                      className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Download className="h-5 w-5  "/>
                    </button>
                    
                    
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status et résultats */}
        {(uploadState.isUploading || uploadState.success || uploadState.error) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. État du traitement
            </h2>
            
            {uploadState.isUploading && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <LoadingSpinner />
                  <span className="text-gray-700">
                    Traitement en cours... {uploadState.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {uploadState.success && (
              <StatusMessage
                type="success"
                message="Fichier traité avec succès ! Le téléchargement va commencer automatiquement."
              />
            )}
            
            {uploadState.error && (
              <StatusMessage
                type="error"
                message={uploadState.error}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EndUserPage;