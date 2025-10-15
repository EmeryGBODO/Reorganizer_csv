import React, { useState, useEffect } from 'react';
import { Save, X, Plus } from 'lucide-react';
import { Campaign, ColumnConfig } from '../types';
import ColumnEditor from './ColumnEditor';
import StatusMessage from './StatusMessage';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
  campaign: Campaign | null;
  editmode: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, campaign, editmode, error, setError }) => {
  const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(campaign);

  useEffect(() => {
    setEditedCampaign(campaign);
  }, [campaign]);

  if (!isOpen || !editedCampaign) {
    return null;
  }

  const handleColumnsChange = (columns: ColumnConfig[]) => {
    if (!editedCampaign) return;
    setEditedCampaign({
      ...editedCampaign,
      columns,
    });
  };

  const handleAddColumn = () => {
    const columns = editedCampaign.columns || [];
    const newColumn: ColumnConfig = {
      id: `col_${Date.now()}`,
      name: `column_${columns.length + 1}`,
      displayName: `Colonne ${columns.length + 1}`,
      order: columns.length,
      required: false,
      rules: [],
    };
    handleColumnsChange([newColumn, ...columns]);
  };

  const handleSaveClick = () => {
    
    console.log("donnée à mettre à jour", editedCampaign);
    
    if(editedCampaign.name.trim() === ''){
        setError('Le nom de la campagne est requis');
        return;
    }
    onSave(editedCampaign);
  };


  return (
    <div className="fixed inset-0 bg-gray-700 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {!editmode ? 'Créer une nouvelle campagne' : 'Modification de la campagne'}
          </h2>
          <div className="flex items-center space-x-2">
            
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
              <X className="h-5 w-5 hover:text-red-400" />
            </button>
          </div>
        </div>
        {error && (
          <div className="p-4">
            <StatusMessage type="error" message={error} />
          </div>
        )}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de la campagne *
              </label>
              <input
                type="text"
                value={editedCampaign.name}
                onChange={(e) =>
                  setEditedCampaign({ ...editedCampaign, name: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom de la campagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={editedCampaign.description}
                onChange={(e) =>
                  setEditedCampaign({ ...editedCampaign, description: e.target.value })
                }
                rows={2}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description de la campagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du fichier de sortie par défaut
              </label>
              <input
                type="text"
                value={editedCampaign.output_file_name}
                onChange={(e) =>
                  setEditedCampaign({ ...editedCampaign, output_file_name: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: export__{date}__.csv"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Variables disponibles : `__nom_original__` `__date__`.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ColumnEditor
              columns={editedCampaign.columns}
              onColumnsChange={handleColumnsChange}
            />
          </div>
        </div>
        <div className="flex items-center justify-end p-6 border-t dark:border-gray-700 space-x-3">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:to-red-600"
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