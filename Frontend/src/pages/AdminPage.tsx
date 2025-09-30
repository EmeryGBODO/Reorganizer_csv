import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import CampaignModal from '../components/CampaignModal'; // Importer la modale
import { Campaign } from '../types';
import { campaignApi } from '../services/api';

const AdminPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignApi.getAll();
      setCampaigns(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      setError('Impossible de charger les campagnes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: `temp_${Date.now()}`,
      name: '',
      description: '',
      columns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingCampaign(newCampaign);
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveCampaign = async (campaignToSave: Campaign) => {
    if (!campaignToSave.name.trim()) {
      setError('Le nom de la campagne est requis');
      return;
    }

    try {
      if (campaignToSave.id.startsWith('temp_')) {
        // Simulation de création
        const createdCampaign = {
          ...campaignToSave,
          id: `campaign_${Date.now()}`,
        };
        // await campaignApi.create(createdCampaign); // Ligne à décommenter avec un vrai backend
        setCampaigns(prev => [...prev, createdCampaign]);
        setSuccess('Campagne créée avec succès');
      } else {
        // Simulation de mise à jour
        // await campaignApi.update(campaignToSave.id, campaignToSave); // Ligne à décommenter
        setCampaigns(prev =>
          prev.map(c => c.id === campaignToSave.id ? campaignToSave : c)
        );
        setSuccess('Campagne mise à jour avec succès');
      }

      handleCloseModal();
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      return;
    }

    try {
      // await campaignApi.delete(id); // Ligne à décommenter
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setSuccess('Campagne supprimée avec succès');
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Chargement des campagnes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Administration des campagnes
            </h1>
            <p className="text-lg text-gray-600">
              Gérez vos campagnes de réorganisation CSV et configurez les colonnes.
            </p>
          </div>
          <button
            onClick={handleCreateCampaign}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </button>
        </div>
      </div>

      {/* Messages de status */}
      
      {success && (
        <StatusMessage type="success" message={success} className="mb-6" />
      )}

      {/* Liste des campagnes en grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500">
            Aucune campagne créée. Commencez par créer votre première campagne.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {campaign.columns.length} colonnes configurées
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditCampaign(campaign)}
                    className="p-2 text-gray-600 hover:text-gray-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* La modale pour l'édition et la création */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCampaign}
        campaign={editingCampaign}
        error={error}
        setError={setError}
      />
    </div>
  );
};

export default AdminPage;