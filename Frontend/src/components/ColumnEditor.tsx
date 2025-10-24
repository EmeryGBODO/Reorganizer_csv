import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2 as EditIcon, Trash2, Plus, Save, X, Calculator } from 'lucide-react'; // Renommé Edit2 en EditIcon
import { ColumnConfig, Rule } from '../types';
import RuleEditor from './RuleEditor';

interface SortableColumnItemProps {
  column: ColumnConfig;
  index: number;
  editingId: string | null;
  editValue: string;
  editingRulesFor: string | null;
  disabled: boolean;
  onEdit: (column: ColumnConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onToggleRules: (columnId: string) => void;
  onEditValueChange: (value: string) => void;
  onRulesChange: (columnId: string, newRules: Rule[]) => void;
}

// Composant pour chaque élément de colonne triable
const SortableColumnItem: React.FC<SortableColumnItemProps> = (props) => {
  const {
    column, index, editingId, editValue, editingRulesFor, disabled,
    onEdit, onSave, onCancel, onDelete, onToggleRules, onEditValueChange, onRulesChange
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined, // Pour que l'élément glissé soit au-dessus
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm transition-shadow ${isDragging ? 'shadow-lg opacity-75' : ''
        } ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {/* Poignée de Drag */}
          <button
            {...attributes}
            {...listeners}
            className={`${disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'cursor-grab text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 active:cursor-grabbing'} ${isDragging ? 'cursor-grabbing' : ''}`}
            disabled={disabled}
            aria-label="Déplacer la colonne"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0"> {/* Ajout de min-w-0 pour éviter le débordement */}
            {editingId === column.id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm" // Taille réduite
                  placeholder="Nom de la colonne"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
                />
                <button onClick={onSave} className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300" title="Sauvegarder"><Save className="h-4 w-4" /></button>
                <button onClick={onCancel} className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" title="Annuler"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="truncate"> {/* Empêche le texte long de pousser les boutons */}
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{column.displayName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Nom technique: {column.name}</p>
                </div>
                {!disabled && (
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2"> {/* Empêche les boutons de passer à la ligne */}
                    <button onClick={() => onToggleRules(column.id)} className={`p-1.5 rounded-md ${editingRulesFor === column.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title="Gérer les règles">
                      <Calculator className="h-4 w-4" />
                    </button>
                    <button onClick={() => onEdit(column)} className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" title="Modifier le nom"><EditIcon className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(column.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md" title="Supprimer la colonne"><Trash2 className="h-4 w-4" /></button>
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
          onRulesChange={(newRules) => onRulesChange(column.id, newRules)}
        />
      )}
    </div>
  );
};


// Composant principal ColumnEditor
const ColumnEditor: React.FC<{ columns: ColumnConfig[]; onColumnsChange: (columns: ColumnConfig[]) => void; disabled?: boolean }> = ({
  columns,
  onColumnsChange,
  disabled = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingRulesFor, setEditingRulesFor] = useState<string | null>(null);

  // Configuration des capteurs pour @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Gestion de la fin du glisser-déposer avec @dnd-kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over?.id);

      const updatedColumnsOrder = arrayMove(columns, oldIndex, newIndex);

      // Mettre à jour le champ 'order' après le déplacement
      const finalColumns = updatedColumnsOrder.map((col, index) => ({
        ...col,
        order: index,
      }));

      onColumnsChange(finalColumns);
    }
  };

  const handleEdit = (column: ColumnConfig) => {
    setEditingId(column.id);
    setEditValue(column.displayName);
    setEditingRulesFor(null); // Fermer l'éditeur de règles si ouvert
  };

  const handleSave = () => {
    if (!editingId) return;

    const updatedColumns = columns.map(col =>
      col.id === editingId
        ? { ...col, displayName: editValue.trim() || `Colonne ${col.order + 1}` } // Nom par défaut si vide
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
    const updatedColumns = columns
        .filter(col => col.id !== id)
        .map((col, index) => ({ ...col, order: index })); // Réindexer après suppression
    onColumnsChange(updatedColumns);
  };

  const handleToggleRules = (columnId: string) => {
    setEditingRulesFor(prev => (prev === columnId ? null : columnId));
    setEditingId(null); // Fermer l'édition du nom si ouvert
  };

  const handleRulesChange = (columnId: string, newRules: Rule[]) => {
    onColumnsChange(columns.map(col =>
      col.id === columnId ? { ...col, rules: newRules } : col
    ));
  };

  const handleAddColumn = () => {
    const newIndex = columns.length;
    const newColumn: ColumnConfig = {
      id: `col_${Date.now()}`, // ID unique basé sur le timestamp
      name: `colonne_${newIndex + 1}`, // Nom technique simple
      displayName: `Nouvelle Colonne ${newIndex + 1}`, // Nom affiché clair
      order: newIndex,
      required: false,
      rules: [],
    };

    // Mettre à jour l'ordre des colonnes existantes si nécessaire (ici on ajoute à la fin)
    const updatedColumns = [...columns, newColumn];
    onColumnsChange(updatedColumns);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 py-3 px-1 bg-white dark:bg-gray-900 z-10 border-b dark:border-gray-700 mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration des colonnes</h3>
        <button
          onClick={handleAddColumn}
          disabled={disabled}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columns.map(col => col.id)} // Utiliser les ID uniques pour @dnd-kit
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {columns.map((column, index) => (
              <SortableColumnItem
                key={column.id}
                column={column}
                index={index}
                editingId={editingId}
                editValue={editValue}
                editingRulesFor={editingRulesFor}
                disabled={disabled}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onToggleRules={handleToggleRules}
                onEditValueChange={setEditValue}
                onRulesChange={handleRulesChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {columns.length === 0 && !disabled && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucune colonne configurée. Cliquez sur "Ajouter" pour commencer.
        </div>
      )}
    </div>
  );
};
export default ColumnEditor;