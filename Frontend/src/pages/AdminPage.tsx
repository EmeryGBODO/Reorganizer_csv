import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, ChevronLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import CampaignModal from '../components/CampaignModal';
import ConfirmModal from '../components/ConfirmModal';
import { Campaign } from '../types';
import { campaignApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editmode, setEditmod] = useState<boolean>(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; campaignId: string | number | null }>({ isOpen: false, campaignId: null });
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
  }, []);

  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignApi.getAll();
      console.log("récupération des campagnes", response.data);
       
      setCampaigns(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      setError('Impossible de charger les campagnes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      name: '',
      description: '',
      columns: [],
      output_file_name: 'export_{nom_original}', // Ajout de l'initialisation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditmod(false)
    setEditingCampaign(newCampaign);
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };


  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
    setEditmod(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveCampaign = async (campaignToSave: Campaign) => {
    if (!campaignToSave.name.trim()) {
      setError('Le nom de la campagne est requis');
      return;
    }

    try {
      if (!editmode) {
        // --- APPEL RÉEL POUR LA CRÉATION ---
        const {...creationData } = campaignToSave;
        const response = await campaignApi.create(creationData);
        setCampaigns(prev => [...prev, response.data]);
        setSuccess('Campagne créée avec succès');
      } else {
        // --- APPEL RÉEL POUR LA MISE À JOUR ---
        const response = await campaignApi.update(campaignToSave?.id, campaignToSave);
        setCampaigns(prev =>
          prev.map(c => (c.id === campaignToSave.id ? response.data : c))
        );
        setSuccess('Campagne mise à jour avec succès');
      }
      setEditmod(false);
      handleCloseModal();
    } catch (error) {
      setError('Erreur lors de la sauvegarde de la campagne.');
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
    setError(null); // Clear error on close
  };

  const handleGoBack = ( ) => { navigate(-1) };

  const handleDeleteCampaign = (id: string | number) => {
    setDeleteModal({ isOpen: true, campaignId: id });
  };

  const confirmDeleteCampaign = async () => {
    if (!deleteModal.campaignId) return;
    try {
      await campaignApi.delete(deleteModal.campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== deleteModal.campaignId));
      setSuccess('Campagne supprimée avec succès');
    } catch (error: unknown) {
      console.log(error?.response.data.error);
      
      error?.response?.data.error == "Impossible de supprimer une campagne liée à des brokers."? setError("Impossible de supprimer une campagne liée à des brokers."):0
      setError('Erreur lors de la suppression');
    }
    setDeleteModal({ isOpen: false, campaignId: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement des campagnes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 ">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
          <button onClick={handleGoBack} className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Administration des campagnes
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Gérez vos campagnes de réorganisation CSV et configurez les colonnes.
            </p>
          </div>
          <button
            onClick={handleCreateCampaign}

className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:to-red-600"          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </button>
        </div>
      </div>

      {error && !isModalOpen && (
        <StatusMessage type="error" message={error} className="mb-6" />
      )}
      {success && (
        <StatusMessage type="success" message={success} className="mb-6" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
            Aucune campagne créée.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign?.id}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{campaign.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{campaign.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-100 mt-2">
                    {campaign.columns?.length} colonnes configurées
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => handleEditCampaign(campaign)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCampaign}
        campaign={editingCampaign}
        editmode={editmode}
        error={error}
        setError={setError}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, campaignId: null })}
        onConfirm={confirmDeleteCampaign}
        title="Supprimer la campagne"
        message="Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible."
        confirmText="Supprimer"
        type="danger"
      />
    </div>
  );
};

export default AdminPage;