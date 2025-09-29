import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X } from 'lucide-react';
import ColumnEditor from '../components/ColumnEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusMessage from '../components/StatusMessage';
import { Campaign, ColumnConfig } from '../types';
import { campaignApi } from '../services/api';

const AdminPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
      // Données de démonstration en cas d'erreur
      setCampaigns([
        {
          id: '1',
          name: 'Campagne Marketing Q1',
          description: 'Réorganisation des données marketing Q1',
          columns: [
            {
              id: 'col1',
              name: 'customer_name',
              displayName: 'Nom du client',
              order: 0,
              required: true,
            },
            {
              id: 'col2',
              name: 'email',
              displayName: 'Adresse email',
              order: 1,
              required: true,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Export Clients',
          description: 'Format standard pour export clients',
          columns: [
            {
              id: 'col3',
              name: 'first_name',
              displayName: 'Prénom',
              order: 0,
              required: true,
            },
            {
              id: 'col4',
              name: 'last_name',
              displayName: 'Nom',
              order: 1,
              required: true,
            },
            {
              id: 'col5',
              name: 'phone',
              displayName: 'Téléphone',
              order: 2,
              required: false,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
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
    setIsCreating(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign({ ...campaign });
    setIsCreating(false);
    setError(null);
    setSuccess(null);
  };

  const handleSaveCampaign = async () => {
    if (!editingCampaign) return;

    if (!editingCampaign.name.trim()) {
      setError('Le nom de la campagne est requis');
      return;
    }

    try {
      if (isCreating) {
        // Simulation de création
        const createdCampaign = {
          ...editingCampaign,
          id: `campaign_${Date.now()}`,
        };
        setCampaigns(prev => [...prev, createdCampaign]);
        setSuccess('Campagne créée avec succès');
      } else {
        // Simulation de mise à jour
        setCampaigns(prev =>
          prev.map(c => c.id === editingCampaign.id ? editingCampaign : c)
        );
        setSuccess('Campagne mise à jour avec succès');
      }

      setEditingCampaign(null);
      setIsCreating(false);
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleCancelEdit = () => {
    setEditingCampaign(null);
    setIsCreating(false);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      return;
    }

    try {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setSuccess('Campagne supprimée avec succès');
    } catch (error) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleColumnsChange = (columns: ColumnConfig[]) => {
    if (!editingCampaign) return;
    setEditingCampaign({
      ...editingCampaign,
      columns,
    });
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
            disabled={!!editingCampaign}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </button>
        </div>
      </div>

      {/* Messages de status */}
      {error && (
        <StatusMessage type="error" message={error} className="mb-6" />
      )}
      {success && (
        <StatusMessage type="success" message={success} className="mb-6" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Liste des campagnes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Campagnes existantes
          </h2>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune campagne créée. Commencez par créer votre première campagne.
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`bg-white border rounded-lg p-4 shadow-sm ${
                  editingCampaign?.id === campaign.id ? 'ring-2 ring-blue-500' : ''
                }`}
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
                      disabled={!!editingCampaign}
                      className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={!!editingCampaign}
                      className="p-2 text-red-600 hover:text-red-700 disabled:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Éditeur de campagne */}
        <div className="space-y-6">
          {editingCampaign ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isCreating ? 'Créer une campagne' : 'Modifier la campagne'}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveCampaign}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la campagne *
                  </label>
                  <input
                    type="text"
                    value={editingCampaign.name}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nom de la campagne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingCampaign.description}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, description: e.target.value })
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description de la campagne"
                  />
                </div>
              </div>

              <div className="mt-6">
                <ColumnEditor
                  columns={editingCampaign.columns}
                  onColumnsChange={handleColumnsChange}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                Sélectionnez une campagne à modifier ou créez-en une nouvelle.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;