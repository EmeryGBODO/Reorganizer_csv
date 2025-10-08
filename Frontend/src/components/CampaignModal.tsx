import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Campaign, ColumnConfig } from '../types';
import ColumnEditor from './ColumnEditor';
import StatusMessage from './StatusMessage';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
  campaign: Campaign | null;
  error: string | null;
  setError: (error: string | null) => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, campaign, error, setError }) => {
  const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(campaign);

  useEffect(() => {
    // Met à jour l'état interne lorsque la prop campaign change
    setEditedCampaign(campaign);
  }, [campaign]);

  if (!isOpen || !editedCampaign) {
    return null;
  }

  const handleColumnsChange = (fields: ColumnConfig[]) => {
    if (!editedCampaign) return;
    setEditedCampaign({
      ...editedCampaign,
      fields,
    });
  };

  const handleSaveClick = () => {
    if(editedCampaign.name.trim() === ''){
        setError('Le nom de la campagne est requis');
        return;
    }
    onSave(editedCampaign);
  };
  
  const isCreating = editedCampaign.uuid.startsWith('temp_');

  return (
    // Fond semi-transparent
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Conteneur de la modale */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? 'Créer une nouvelle campagne' : 'Modifier la campagne'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && (
            <div className="p-4">
                <StatusMessage type="error" message={error} />
            </div>
        )}
        {/* Corps de la modale (avec scroll) */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la campagne *
            </label>
            <input
              type="text"
              value={editedCampaign.name}
              onChange={(e) =>
                setEditedCampaign({ ...editedCampaign, name: e.target.value })
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
              value={editedCampaign.description}
              onChange={(e) =>
                setEditedCampaign({ ...editedCampaign, description: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description de la campagne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du fichier de sortie par défaut
            </label>
            <input
              type="text"
              value={editedCampaign.outputFilenameTemplate}
              onChange={(e) =>
                setEditedCampaign({ ...editedCampaign, outputFilenameTemplate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex: export__{date}__.csv"
            />
            {/* --- LIGNE CORRIGÉE --- */}
            <p className="text-xs text-gray-500 mt-1">
              Variables disponibles : `__nom_original__` `__date__`.
            </p>
          </div>

          <div className="mt-4">
            <ColumnEditor
              columns={editedCampaign.fields}
              onColumnsChange={handleColumnsChange}
            />
          </div>
        </div>

        {/* Pied de la modale */}
        <div className="flex items-center justify-end p-6 border-t space-x-3">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;