import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, CreditCard as Edit2, Trash2, Plus, Save, X, Calculator } from 'lucide-react';
import { ColumnConfig, Rule } from '../types';
import RuleEditor from './RuleEditor'; // Importer le nouvel éditeur

interface ColumnEditorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  disabled?: boolean;
}

const ColumnEditor: React.FC<ColumnEditorProps> = ({
  columns,
  onColumnsChange,
  disabled = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingRulesFor, setEditingRulesFor] = useState<string | null>(null); // Nouvel état

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || disabled) return;

    if (result.source.index === result.destination.index) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedColumns = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    onColumnsChange(updatedColumns);
  };

  const handleEdit = (column: ColumnConfig) => {
    setEditingId(column.id);
    setEditValue(column.displayName);
  };

  const handleSave = () => {
    if (!editingId) return;

    const updatedColumns = columns.map(col =>
      col.id === editingId
        ? { ...col, displayName: editValue.trim() }
        : col
    );

    onColumnsChange(updatedColumns);
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = (id: string) => {
    onColumnsChange(columns.filter(col => col.id !== id));
  };

  const handleToggleRules = (columnId: string) => {
    setEditingRulesFor(prev => (prev === columnId ? null : columnId));
  };

  const handleRulesChange = (columnId: string, newRules: Rule[]) => {
    onColumnsChange(columns.map(col =>
      col.id === columnId ? { ...col, rules: newRules } : col
    ));
  };

  const handleAddColumn = () => {
    const newColumn: ColumnConfig = {
      id: `col_${Date.now()}`,
      name: `column_${columns.length + 1}`,
      displayName: `Colonne ${columns.length + 1}`,
      order: columns.length,
      required: false,
      rules: [], // Initialiser avec un tableau de règles vide
    };

    onColumnsChange([newColumn, ...columns]);
  };

  return (
    <div className="space-y-4 ">
      <div className="flex items-center justify-between sticky -top-6 p-2 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration des colonnes</h3>
        <button
          onClick={handleAddColumn}
          disabled={disabled}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-purple-600 hover:bg-red-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une colonne
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {columns.map((column, index) => (
                <Draggable
                  key={column.id}
                  draggableId={String(column.id)}
                  index={index}
                  isDragDisabled={disabled}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''
                        } ${disabled ? 'opacity-50' : ''}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center space-x-4">
                          <div
                            {...provided.dragHandleProps}
                            className={`${disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'cursor-grab text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'} ${snapshot.isDragging ? 'cursor-grabbing' : ''}`}
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            {editingId === column.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Nom de la colonne"
                                />
                                <button onClick={handleSave} className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"><Save className="h-4 w-4" /></button>
                                <button onClick={handleCancel} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center  justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{column.displayName}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Nom technique: {column.name}</p>
                                </div>
                                {!disabled && (
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => handleToggleRules(column.id)} className={`p-2 rounded-md ${editingRulesFor === column.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'}`} title="Gérer les règles">
                                      <Calculator className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleEdit(column)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" title="Modifier le nom"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => handleDelete(column.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" title="Supprimer la colonne"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Section dépliable pour les règles */}
                      {editingRulesFor === column.id && (
                        <RuleEditor
                          rules={column.rules || []}
                          onRulesChange={(newRules) => handleRulesChange(column.id, newRules)}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {columns.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucune colonne configurée. Ajoutez votre première colonne.
        </div>
      )}
    </div>
  );
};
export default ColumnEditor;