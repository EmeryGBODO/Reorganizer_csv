import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, Edit, Check, X, Filter, GripVertical } from 'lucide-react'; // Ajout de GripVertical
import { Rule, RuleType, ConditionType } from '../types';

interface RuleEditorProps {
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

// Options de règles (inchangées)
const ruleOptions: { value: RuleType; label: string; needsValue: boolean; valueType?: 'text' | 'number' | 'percentage' }[] = [
  { value: 'TO_UPPERCASE', label: 'Mettre en majuscules', needsValue: false },
  { value: 'TO_LOWERCASE', label: 'Mettre en minuscules', needsValue: false },
  { value: 'ADD_PREFIX', label: 'Ajouter un préfixe', needsValue: true, valueType: 'text' },
  { value: 'ADD_SUFFIX', label: 'Ajouter un suffixe', needsValue: true, valueType: 'text' },
  { value: 'MULTIPLY_BY', label: 'Multiplier par', needsValue: true, valueType: 'number' },
  { value: 'REPLACE_TEXT', label: 'Remplacer le texte', needsValue: true, valueType: 'text' },
  { value: 'ADJUST_PERCENTAGE', label: 'Ajuster en pourcentage', needsValue: true, valueType: 'percentage' },
  { value: 'SET_MAX_VALUE', label: 'Plafonner à (Valeur Max)', needsValue: true, valueType: 'number' },
  { value: 'SET_MIN_VALUE', label: 'Plancher à (Valeur Min)', needsValue: true, valueType: 'number' },
];

// Options pour les conditions (inchangées)
const conditionOptions: { value: ConditionType; label: string }[] = [
    { value: 'GREATER_THAN', label: 'est supérieur à' },
    { value: 'LESS_THAN', label: 'est inférieur à' },
    { value: 'EQUALS', label: 'est égal à' },
    { value: 'NOT_EQUALS', label: 'est différent de' },
    { value: 'CONTAINS', label: 'contient' },
    { value: 'NOT_CONTAINS', label: 'ne contient pas' },
];

// --- Composant SortableRuleItem ---
interface SortableRuleItemProps {
    rule: Rule;
    index: number;
    editingRuleId: string | null;
    editingRule: Rule | null; // Pass editingRule state down
    editingRuleConfig: typeof ruleOptions[0] | undefined;
    showEditConditionForm: boolean; // Pass showEditConditionForm state down
    onEditRule: (rule: Rule) => void;
    handleSaveEdit: () => void;
    handleCancelEdit: () => void;
    handleDeleteRule: (ruleId: string) => void;
    getRuleDescription: (rule: Rule) => string;
    renderValueInput: (rule: Partial<Rule>, onChange: (field: keyof Rule, value: any) => void, config?: typeof ruleOptions[0]) => JSX.Element | null;
    renderConditionForm: (
        conditionType: ConditionType | undefined,
        conditionValue: string | number,
        onTypeChange: (value: ConditionType | undefined) => void,
        onValueChange: (value: string | number) => void,
        onToggle: () => void,
        isVisible: boolean
    ) => JSX.Element;
    setEditingRule: (rule: Rule | null) => void; // Function to update editingRule state in parent
    setShowEditConditionForm: (show: boolean) => void; // Function to update showEditConditionForm state in parent
}

const SortableRuleItem: React.FC<SortableRuleItemProps> = (props) => {
    const {
        rule, index, editingRuleId, editingRule, editingRuleConfig, showEditConditionForm,
        onEditRule, handleSaveEdit, handleCancelEdit, handleDeleteRule,
        getRuleDescription, renderValueInput, renderConditionForm,
        setEditingRule, setShowEditConditionForm
    } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: rule.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={`bg-white dark:bg-gray-700 p-2 border border-gray-200 dark:border-gray-600 rounded-md ${isDragging ? 'shadow-lg opacity-75' : 'shadow-sm'}`}>
            {editingRuleId === rule.id && editingRule ? (
                // --- VUE D'ÉDITION ---
                <div>
                    <div className="flex items-center gap-2">
                        {/* Poignée (non utilisable en mode édition) */}
                        <div className="text-gray-300 dark:text-gray-600 cursor-not-allowed p-1">
                            <GripVertical className="h-4 w-4" />
                        </div>
                        <select
                            value={editingRule.type}
                            onChange={(e) => {
                            const newType = e.target.value as RuleType;
                            const config = ruleOptions.find(opt => opt.value === newType);
                            setEditingRule({ // Utiliser setEditingRule du parent
                                ...(editingRule as Rule),
                                type: newType,
                                ...(editingRule?.type === 'REPLACE_TEXT' && newType !== 'REPLACE_TEXT' ? { searchValue: undefined, replaceValue: undefined } : {}),
                                value: (newType === 'REPLACE_TEXT' || !config?.needsValue) ? undefined : (editingRule?.value ?? ''),
                                ...(newType === 'REPLACE_TEXT' ? { searchValue: editingRule?.searchValue ?? '', replaceValue: editingRule?.replaceValue ?? '' } : {})
                            });
                            }}
                            className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
                        >
                            {ruleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>

                        {renderValueInput(editingRule, (field, value) => setEditingRule({ ...(editingRule as Rule), [field]: value }), editingRuleConfig)}

                        <button onClick={handleSaveEdit} className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"><Check className="h-4 w-4" /></button>
                        <button onClick={handleCancelEdit} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>
                    </div>
                     {/* Formulaire de condition pour l'édition */}
                     {editingRuleConfig?.needsValue && renderConditionForm(
                        editingRule.conditionType,
                        editingRule.conditionValue ?? '',
                        (value) => setEditingRule({ ...(editingRule as Rule), conditionType: value }), // Utiliser setEditingRule
                        (value) => setEditingRule({ ...(editingRule as Rule), conditionValue: value }), // Utiliser setEditingRule
                        () => {
                            setShowEditConditionForm(!showEditConditionForm); // Utiliser setShowEditConditionForm du parent
                            if (showEditConditionForm) {
                                setEditingRule((prev: Rule | null) => { // Utiliser setEditingRule
                                    if (!prev) return null;
                                    const { conditionType, conditionValue, ...rest } = prev;
                                    return rest as Rule; // Assurer le type correct
                                });
                            }
                        },
                        showEditConditionForm
                    )}
                 </div>
            ) : (
                // --- VUE D'AFFICHAGE ---
                <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0"> {/* Ajout flex-1 min-w-0 */}
                        {/* Poignée de Drag */}
                        <button {...attributes} {...listeners} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing mr-2" aria-label="Déplacer la règle">
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{index + 1}. {getRuleDescription(rule)}</span>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2"> {/* flex-shrink-0 ml-2 */}
                        <button onClick={() => onEditRule(rule)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteRule(rule.id)} className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Composant Principal RuleEditor ---
const RuleEditor: React.FC<RuleEditorProps> = ({ rules, onRulesChange }) => {
  // --- États pour l'ajout --- (inchangés)
  const [newRuleType, setNewRuleType] = useState<RuleType>('TO_UPPERCASE');
  const [newRuleValue, setNewRuleValue] = useState<string | number>('');
  const [newSearchValue, setNewSearchValue] = useState('');
  const [newReplaceValue, setNewReplaceValue] = useState('');
  const [newConditionType, setNewConditionType] = useState<ConditionType | undefined>(undefined);
  const [newConditionValue, setNewConditionValue] = useState<string | number>('');
  const [showNewConditionForm, setShowNewConditionForm] = useState(false);

  // --- États pour l'édition --- (inchangés)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showEditConditionForm, setShowEditConditionForm] = useState(false);

  const selectedRuleConfig = ruleOptions.find(opt => opt.value === newRuleType);
  const editingRuleConfig = editingRule ? ruleOptions.find(opt => opt.value === editingRule.type) : undefined;

  // Configuration des capteurs @dnd-kit
   const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialiser le formulaire d'édition (inchangé)
  useEffect(() => {
    if (editingRuleId) {
      const ruleToEdit = rules.find(r => r.id === editingRuleId);
      if (ruleToEdit) {
          setEditingRule({ ...ruleToEdit }); // Copier la règle pour éviter la mutation directe
          setShowEditConditionForm(!!ruleToEdit.conditionType);
      } else {
          setEditingRule(null);
          setShowEditConditionForm(false);
      }
    } else {
      setEditingRule(null);
      setShowEditConditionForm(false);
    }
  }, [editingRuleId, rules]);

  // Ajouter une règle
  const handleAddRule = () => {
    if (!newRuleType) return;
    if (newRuleType === 'REPLACE_TEXT' && (!newReplaceValue)) return;
    if (selectedRuleConfig?.needsValue && newRuleType !== 'REPLACE_TEXT' && newRuleValue === '') return;
    if (showNewConditionForm && (!newConditionType || newConditionValue === '')) return;

    const newRule: Rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // ID plus unique
      type: newRuleType,
      order: rules.length, // Assigner l'ordre à la fin
      ...(newRuleType === 'REPLACE_TEXT'
        ? { searchValue: newSearchValue, replaceValue: newReplaceValue }
        : { value: selectedRuleConfig?.needsValue ? newRuleValue : undefined }
      ),
      ...(showNewConditionForm && newConditionType
        ? { conditionType: newConditionType, conditionValue: newConditionValue }
        : {}
      )
    };

    // Ajouter la règle et réindexer
    const updatedRules = [...rules, newRule].map((rule, index) => ({ ...rule, order: index }));
    onRulesChange(updatedRules);

    // Réinitialiser le formulaire
    setNewRuleType('TO_UPPERCASE');
    setNewRuleValue('');
    setNewSearchValue('');
    setNewReplaceValue('');
    setNewConditionType(undefined);
    setNewConditionValue('');
    setShowNewConditionForm(false);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRuleId(rule.id);
  };

  // Sauvegarder l'édition
  const handleSaveEdit = () => {
    if (!editingRule) return;

    // Validations (inchangées)
    if (editingRule.type === 'REPLACE_TEXT' && (!editingRule.searchValue || !editingRule.replaceValue)) {
      alert('Les champs "Texte à chercher" et "Texte à remplacer" sont requis.'); return;
    }
    if (editingRuleConfig?.needsValue && editingRule.type !== 'REPLACE_TEXT' && (editingRule.value === '' || editingRule.value === undefined)) {
        alert('Le champ "Valeur" est requis pour ce type de règle.'); return;
    }
    if (showEditConditionForm && (!editingRule.conditionType || editingRule.conditionValue === '' || editingRule.conditionValue === undefined)) {
      alert('Le type et la valeur de la condition sont requis.'); return;
    }

    // Préparer la règle mise à jour propre
    const updatedRuleData: Partial<Rule> = { // Utiliser Partial<Rule> pour construire
        id: editingRule.id,
        type: editingRule.type,
        order: editingRule.order // Conserver l'ordre existant
    };

    if (editingRule.type === 'REPLACE_TEXT') {
        updatedRuleData.searchValue = editingRule.searchValue?.trim() ?? '';
        updatedRuleData.replaceValue = editingRule.replaceValue?.trim() ?? '';
    } else if (editingRuleConfig?.needsValue) {
        updatedRuleData.value = editingRule.value;
    }

    if (showEditConditionForm && editingRule.conditionType) {
        updatedRuleData.conditionType = editingRule.conditionType;
        updatedRuleData.conditionValue = editingRule.conditionValue;
    } else {
        // Assurer que les champs conditionnels sont supprimés si le form n'est pas montré
        delete updatedRuleData.conditionType;
        delete updatedRuleData.conditionValue;
    }


    onRulesChange(rules.map(rule => (rule.id === editingRule.id ? updatedRuleData as Rule : rule)));
    setEditingRuleId(null);
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
  };

  // Supprimer une règle
  const handleDeleteRule = (ruleId: string) => {
      // Filtrer la règle et réindexer
      const updatedRules = rules
          .filter(rule => rule.id !== ruleId)
          .map((rule, index) => ({ ...rule, order: index }));
      onRulesChange(updatedRules);
  };


  // --- Fonction handleDragEnd pour @dnd-kit ---
  const handleRuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
        const oldIndex = rules.findIndex((rule) => rule.id === active.id);
        const newIndex = rules.findIndex((rule) => rule.id === over?.id);

        // Déplacer et réindexer
        const updatedRules = arrayMove(rules, oldIndex, newIndex).map((rule, index) => ({
            ...rule,
            order: index, // Mettre à jour le champ 'order'
        }));

        onRulesChange(updatedRules);
    }
  };


  // Obtenir la description (inchangée, mais utilise la règle avec 'order')
  const getRuleDescription = (rule: Rule) => {
    const option = ruleOptions.find(opt => opt.value === rule.type);
    if (!option) return 'Règle inconnue';
    let description = option.label;
    if (option.needsValue) {
      if (rule.type === 'REPLACE_TEXT') {
        description += ` : "${rule.searchValue || ''}" → "${rule.replaceValue || ''}"`;
      } else if (rule.type === 'ADJUST_PERCENTAGE') {
        const value = Number(rule.value);
        description += ` : ${value >= 0 ? '+' : ''}${rule.value}%`;
      } else {
        description += ` : "${rule.value}"`;
      }
    }
    if (rule.conditionType && rule.conditionValue !== undefined) {
      const conditionLabel = conditionOptions.find(c => c.value === rule.conditionType)?.label || rule.conditionType;
      description += ` (SI ${conditionLabel} "${rule.conditionValue}")`;
    }
    return description;
  };

  // Rendre le champ de valeur (inchangé)
  const renderValueInput = (rule: Partial<Rule>, onChange: (field: keyof Rule, value: any) => void, config?: typeof ruleOptions[0]) => {
     if (!config?.needsValue) return null;
     if (rule.type === 'REPLACE_TEXT') {
       return (
         <>
           <input placeholder="Texte à chercher" value={rule.searchValue || ''} onChange={(e) => onChange('searchValue', e.target.value)} className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"/>
           <input placeholder="Texte à remplacer" value={rule.replaceValue || ''} onChange={(e) => onChange('replaceValue', e.target.value)} className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"/>
         </>
       );
     }
     const inputType = config.valueType === 'number' || config.valueType === 'percentage' ? 'number' : 'text';
     return (
       <div className="relative flex items-center">
         <input type={inputType} step={config.valueType === 'percentage' ? 'any' : undefined} value={rule.value ?? ''} onChange={(e) => onChange('value', e.target.value)} className={`w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm ${config.valueType === 'percentage' ? 'pr-6' : ''}`} placeholder="Valeur"/>
         {config.valueType === 'percentage' && (<span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>)}
       </div>
     );
  };

  // Rendre le formulaire de condition (inchangé)
  const renderConditionForm = (conditionType: ConditionType | undefined, conditionValue: string | number, onTypeChange: (value: ConditionType | undefined) => void, onValueChange: (value: string | number) => void, onToggle: () => void, isVisible: boolean) => {
     return (
         <div className="mt-2 space-y-2">
             {!isVisible ? (<button type="button" onClick={onToggle} className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"><Filter className="h-3 w-3 mr-1" /> Ajouter une condition</button>)
             : (<div className="p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-medium">SI</span>
                     <select value={conditionType || ''} onChange={(e) => onTypeChange(e.target.value as ConditionType || undefined)} className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-2 py-1 text-sm">
                         <option value="">-- Choisir opérateur --</option>
                         {conditionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                     </select>
                     <input placeholder="Valeur" value={conditionValue} onChange={(e) => onValueChange(e.target.value)} className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-2 py-1 text-sm"/>
                      <button type="button" onClick={onToggle} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Retirer la condition"><X className="h-4 w-4" /></button>
                  </div>
                 </div>
             )}
         </div>
     );
  };


  // --- JSX Principal ---
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md space-y-4">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Règles de calcul (Glissez pour réorganiser)</h4>

      {/* --- Liste des règles avec DndContext --- */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRuleDragEnd}>
        <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
                {rules.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Aucune règle définie.</p>
                ) : (
                    rules.map((rule, index) => (
                        <SortableRuleItem
                            key={rule.id}
                            rule={rule}
                            index={index}
                            editingRuleId={editingRuleId}
                            editingRule={editingRule}
                            editingRuleConfig={editingRuleConfig}
                            showEditConditionForm={showEditConditionForm}
                            onEditRule={handleEditRule}
                            handleSaveEdit={handleSaveEdit}
                            handleCancelEdit={handleCancelEdit}
                            handleDeleteRule={handleDeleteRule}
                            getRuleDescription={getRuleDescription}
                            renderValueInput={renderValueInput}
                            renderConditionForm={renderConditionForm}
                            setEditingRule={setEditingRule} // Passer la fonction de mise à jour
                            setShowEditConditionForm={setShowEditConditionForm} // Passer la fonction de mise à jour
                        />
                    ))
                )}
            </div>
        </SortableContext>
      </DndContext>

      {/* --- Formulaire d'ajout (inchangé) --- */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
        <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Ajouter une règle</h5>
        <div className="flex items-center gap-2">
            <select
            value={newRuleType}
            onChange={(e) => {
                setNewRuleType(e.target.value as RuleType);
                const config = ruleOptions.find(opt => opt.value === e.target.value);
                if (!config?.needsValue || config.valueType !== selectedRuleConfig?.valueType) {
                    setNewRuleValue(''); setNewSearchValue(''); setNewReplaceValue('');
                }
            }}
            className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
            >
            {ruleOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>

            {renderValueInput({ type: newRuleType, value: newRuleValue, searchValue: newSearchValue, replaceValue: newReplaceValue },
                (field, value) => {
                    if (field === 'value') setNewRuleValue(value);
                    if (field === 'searchValue') setNewSearchValue(value);
                    if (field === 'replaceValue') setNewReplaceValue(value);
                }, selectedRuleConfig)}

            <button onClick={handleAddRule} className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:to-red-600" title="Ajouter la règle"><Plus className="h-4 w-4" /></button>
        </div>
         {selectedRuleConfig?.needsValue && renderConditionForm(newConditionType, newConditionValue, setNewConditionType, setNewConditionValue,
             () => {
                setShowNewConditionForm(!showNewConditionForm);
                if (showNewConditionForm) { setNewConditionType(undefined); setNewConditionValue(''); }
            }, showNewConditionForm)}
       </div>
    </div>
  );
};

export default RuleEditor;