import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, X, Filter } from 'lucide-react';
import { Rule, RuleType, ConditionType } from '../types'; // Import des types mis à jour

interface RuleEditorProps {
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

// Options de règles mises à jour
const ruleOptions: { value: RuleType; label: string; needsValue: boolean; valueType?: 'text' | 'number' | 'percentage' }[] = [
  { value: 'TO_UPPERCASE', label: 'Mettre en majuscules', needsValue: false },
  { value: 'TO_LOWERCASE', label: 'Mettre en minuscules', needsValue: false },
  { value: 'ADD_PREFIX', label: 'Ajouter un préfixe', needsValue: true, valueType: 'text' },
  { value: 'ADD_SUFFIX', label: 'Ajouter un suffixe', needsValue: true, valueType: 'text' },
  { value: 'MULTIPLY_BY', label: 'Multiplier par', needsValue: true, valueType: 'number' },
  { value: 'REPLACE_TEXT', label: 'Remplacer le texte', needsValue: true, valueType: 'text' }, // needsValue est vrai pour afficher les champs spéciaux
  { value: 'ADJUST_PERCENTAGE', label: 'Ajuster en pourcentage', needsValue: true, valueType: 'percentage' }, // Ajouté
  { value: 'SET_MAX_VALUE', label: 'Plafonner à (Valeur Max)', needsValue: true, valueType: 'number' },    // Ajouté
  { value: 'SET_MIN_VALUE', label: 'Plancher à (Valeur Min)', needsValue: true, valueType: 'number' },      // Ajouté
];

// Options pour les conditions
const conditionOptions: { value: ConditionType; label: string }[] = [
    { value: 'GREATER_THAN', label: 'est supérieur à' },
    { value: 'LESS_THAN', label: 'est inférieur à' },
    { value: 'EQUALS', label: 'est égal à' },
    { value: 'NOT_EQUALS', label: 'est différent de' },
    { value: 'CONTAINS', label: 'contient' },
    { value: 'NOT_CONTAINS', label: 'ne contient pas' },
];

const RuleEditor: React.FC<RuleEditorProps> = ({ rules, onRulesChange }) => {
  // --- États pour l'ajout ---
  const [newRuleType, setNewRuleType] = useState<RuleType>('TO_UPPERCASE');
  const [newRuleValue, setNewRuleValue] = useState<string | number>('');
  const [newSearchValue, setNewSearchValue] = useState('');
  const [newReplaceValue, setNewReplaceValue] = useState('');
  const [newConditionType, setNewConditionType] = useState<ConditionType | undefined>(undefined);
  const [newConditionValue, setNewConditionValue] = useState<string | number>('');
  const [showNewConditionForm, setShowNewConditionForm] = useState(false);

  // --- États pour l'édition ---
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showEditConditionForm, setShowEditConditionForm] = useState(false);

  const selectedRuleConfig = ruleOptions.find(opt => opt.value === newRuleType);
  const editingRuleConfig = editingRule ? ruleOptions.find(opt => opt.value === editingRule.type) : undefined;

  // Effet pour initialiser le formulaire d'édition
  useEffect(() => {
    if (editingRuleId) {
      const ruleToEdit = rules.find(r => r.id === editingRuleId);
      setEditingRule(ruleToEdit || null);
      // Afficher le formulaire de condition si la règle en a une
      setShowEditConditionForm(!!ruleToEdit?.conditionType);
    } else {
      setEditingRule(null);
      setShowEditConditionForm(false);
    }
  }, [editingRuleId, rules]);

  const handleAddRule = () => {
    if (!newRuleType) return;
    if (newRuleType === 'REPLACE_TEXT' && (!newReplaceValue)) return; // Replace ne peuvent être vides
    if (selectedRuleConfig?.needsValue && newRuleType !== 'REPLACE_TEXT' && newRuleValue === '') return; // Autres champs valeur requis si besoin
    if (showNewConditionForm && (!newConditionType || newConditionValue === '')) return; // Condition requise si affichée

    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      type: newRuleType,
      ...(newRuleType === 'REPLACE_TEXT'
        ? { searchValue: newSearchValue, replaceValue: newReplaceValue }
        : { value: selectedRuleConfig?.needsValue ? newRuleValue : undefined }
      ),
      ...(showNewConditionForm && newConditionType
        ? { conditionType: newConditionType, conditionValue: newConditionValue }
        : {}
      )
    };

    onRulesChange([...rules, newRule]);
    // Réinitialiser le formulaire d'ajout
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

  const handleSaveEdit = () => {
    if (!editingRule) return;

    // Validation spécifique pour REPLACE_TEXT
    if (editingRule.type === 'REPLACE_TEXT') {
      if (!editingRule.searchValue || !editingRule.replaceValue) {
        alert('Les champs "Texte à chercher" et "Texte à remplacer" sont requis.');
        return;
      }
    }
    // Validation des autres champs valeur
    if (editingRuleConfig?.needsValue && editingRule.type !== 'REPLACE_TEXT' && editingRule.value === '') {
        alert('Le champ "Valeur" est requis pour ce type de règle.');
        return;
    }
    // Validation de la condition si affichée
    if (showEditConditionForm && (!editingRule.conditionType || editingRule.conditionValue === '')) {
      alert('Le type et la valeur de la condition sont requis.');
      return;
    }

    // Nettoyer les propriétés non pertinentes avant sauvegarde
    const cleanedRule: Rule = {
        id: editingRule.id,
        type: editingRule.type,
    };

    const updatedRule = editingRule.type === 'REPLACE_TEXT' 
      ? {
          ...editingRule,
          searchValue: editingRule.searchValue?.trim() || '',
          replaceValue: editingRule.replaceValue?.trim() || '',
          value: undefined
        }
      : {
          ...editingRule,
          searchValue: undefined,
          replaceValue: undefined
        };

    if (editingRule.type === 'REPLACE_TEXT') {
        cleanedRule.searchValue = editingRule.searchValue;
        cleanedRule.replaceValue = editingRule.replaceValue;
    } else if (editingRuleConfig?.needsValue) {
        cleanedRule.value = editingRule.value;
    }

    if (showEditConditionForm && editingRule.conditionType) {
        cleanedRule.conditionType = editingRule.conditionType;
        cleanedRule.conditionValue = editingRule.conditionValue;
    }

    onRulesChange(rules.map(rule => (rule.id === editingRule.id ? updatedRule : rule)));
    setEditingRuleId(null);
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  // Fonction pour afficher la description de la règle et de sa condition
  const getRuleDescription = (rule: Rule) => {
    const option = ruleOptions.find(opt => opt.value === rule.type);
    if (!option) return 'Règle inconnue';

    let description = option.label;
    if (option.needsValue) {
      if (rule.type === 'REPLACE_TEXT') {
        const searchValue = rule.searchValue || '';
        const replaceValue = rule.replaceValue || '';
        description += ` : "${searchValue}" → "${replaceValue}"`;
      } else if (rule.type === 'ADJUST_PERCENTAGE') {
        const value = Number(rule.value);
        description += ` : ${value >= 0 ? '+' : ''}${rule.value}%`; // Ajoute signe et %
      } else {
        description += ` : "${rule.value}"`;
      }
    }

    // Ajouter la description de la condition si elle existe
    if (rule.conditionType && rule.conditionValue !== undefined) {
      const conditionLabel = conditionOptions.find(c => c.value === rule.conditionType)?.label || rule.conditionType;
      description += ` (SI ${conditionLabel} "${rule.conditionValue}")`;
    }

    return description;
  };

  // Fonction pour rendre le champ de valeur approprié
  const renderValueInput = (rule: Partial<Rule>, onChange: (field: keyof Rule, value: any) => void, config?: typeof ruleOptions[0]) => {
    if (!config?.needsValue) return null;

    if (rule.type === 'REPLACE_TEXT') {
      return (
        <>
          <input
            placeholder="Texte à chercher"
            value={rule.searchValue || ''}
            onChange={(e) => onChange('searchValue', e.target.value)}
            className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
          />
          <input
            placeholder="Texte à remplacer"
            value={rule.replaceValue || ''}
            onChange={(e) => onChange('replaceValue', e.target.value)}
            className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
          />
        </>
      );
    }

    const inputType = config.valueType === 'number' || config.valueType === 'percentage' ? 'number' : 'text';

    return (
      <div className="relative flex items-center">
        <input
          type={inputType}
          step={config.valueType === 'percentage' ? 'any' : undefined} // Permet les décimales pour pourcentage
          value={rule.value ?? ''}
          onChange={(e) => onChange('value', e.target.value)}
          className={`w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm ${config.valueType === 'percentage' ? 'pr-6' : ''}`}
          placeholder="Valeur"
        />
        {config.valueType === 'percentage' && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
        )}
      </div>
    );
  };

  // Fonction pour rendre le formulaire de condition
  const renderConditionForm = (
    conditionType: ConditionType | undefined,
    conditionValue: string | number,
    onTypeChange: (value: ConditionType | undefined) => void,
    onValueChange: (value: string | number) => void,
    onToggle: () => void,
    isVisible: boolean
  ) => {
    return (
        <div className="mt-2 space-y-2">
            {!isVisible ? (
                <button
                type="button"
                onClick={onToggle}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                >
                <Filter className="h-3 w-3 mr-1" /> Ajouter une condition
                </button>
            ) : (
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 space-y-2">
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">SI</span>
                    <select
                        value={conditionType || ''}
                        onChange={(e) => onTypeChange(e.target.value as ConditionType || undefined)}
                        className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-2 py-1 text-sm"
                    >
                        <option value="">-- Choisir opérateur --</option>
                        {conditionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <input
                        placeholder="Valeur"
                        value={conditionValue}
                        onChange={(e) => onValueChange(e.target.value)}
                        className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-2 py-1 text-sm"
                    />
                     <button
                        type="button"
                        onClick={onToggle}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Retirer la condition"
                    >
                        <X className="h-4 w-4" />
                    </button>
                 </div>
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md space-y-4">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Règles de calcul</h4>

      {/* Liste des règles existantes */}
      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Aucune règle définie.</p>
        ) : (
          rules.map((rule, index) => (
            <div key={rule.id} className="bg-white dark:bg-gray-700 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
              {editingRuleId === rule.id && editingRule ? (
                // --- VUE D'ÉDITION ---
                 <div>
                    <div className="flex items-center gap-2">
                    <select
                        value={editingRule.type}
                        onChange={(e) => {
                        const newType = e.target.value as RuleType;
                        const config = ruleOptions.find(opt => opt.value === newType);
                        setEditingRule(prev => ({
                            ...(prev as Rule),
                            type: newType,
                            // Réinitialiser searchValue/replaceValue si on quitte REPLACE_TEXT
                            ...(prev?.type === 'REPLACE_TEXT' && newType !== 'REPLACE_TEXT' ? { searchValue: undefined, replaceValue: undefined } : {}),
                            // Réinitialiser value si on passe à REPLACE_TEXT ou si la nouvelle règle n'a pas besoin de valeur
                            value: (newType === 'REPLACE_TEXT' || !config?.needsValue) ? undefined : (prev?.value ?? ''),
                            // Initialiser searchValue/replaceValue si on passe à REPLACE_TEXT
                            ...(newType === 'REPLACE_TEXT' ? { searchValue: prev?.searchValue ?? '', replaceValue: prev?.replaceValue ?? '' } : {})
                        }));
                        }}
                        className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
                    >
                        {ruleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>

                    {renderValueInput(editingRule, (field, value) => setEditingRule(prev => ({ ...(prev as Rule), [field]: value })), editingRuleConfig)}

                    <button onClick={handleSaveEdit} className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"><Check className="h-4 w-4" /></button>
                    <button onClick={handleCancelEdit} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>
                    </div>
                     {/* Formulaire de condition pour l'édition */}
                     {editingRuleConfig?.needsValue && renderConditionForm(
                        editingRule.conditionType,
                        editingRule.conditionValue ?? '',
                        (value) => setEditingRule(prev => ({ ...(prev as Rule), conditionType: value })),
                        (value) => setEditingRule(prev => ({ ...(prev as Rule), conditionValue: value })),
                        () => {
                            setShowEditConditionForm(!showEditConditionForm);
                             // Si on cache, on supprime la condition de l'état d'édition
                            if (showEditConditionForm) {
                                setEditingRule(prev => {
                                    const { conditionType, conditionValue, ...rest } = prev as Rule;
                                    return rest;
                                });
                            }
                        },
                        showEditConditionForm
                    )}
                 </div>
              ) : (
                // --- VUE D'AFFICHAGE ---
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{index + 1}. {getRuleDescription(rule)}</span>
                  <div className="flex items-center">
                    <button onClick={() => handleEditRule(rule)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteRule(rule.id)} className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulaire pour ajouter une règle */}
       <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
            <select
            value={newRuleType}
            onChange={(e) => {
                setNewRuleType(e.target.value as RuleType);
                // Réinitialiser la valeur si le nouveau type n'en a pas besoin ou change de format
                const config = ruleOptions.find(opt => opt.value === e.target.value);
                if (!config?.needsValue || config.valueType !== selectedRuleConfig?.valueType) {
                    setNewRuleValue('');
                    setNewSearchValue('');
                    setNewReplaceValue('');
                }
            }}
            className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
            >
            {ruleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>

            {renderValueInput(
            { type: newRuleType, value: newRuleValue, searchValue: newSearchValue, replaceValue: newReplaceValue },
            (field, value) => {
                if (field === 'value') setNewRuleValue(value);
                if (field === 'searchValue') setNewSearchValue(value);
                if (field === 'replaceValue') setNewReplaceValue(value);
            },
            selectedRuleConfig
            )}

            <button
            onClick={handleAddRule}
            className="p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            title="Ajouter la règle"
            >
            <Plus className="h-4 w-4" />
            </button>
        </div>
         {/* Formulaire de condition pour l'ajout */}
         {selectedRuleConfig?.needsValue && renderConditionForm(
            newConditionType,
            newConditionValue,
            setNewConditionType,
            setNewConditionValue,
             () => {
                setShowNewConditionForm(!showNewConditionForm);
                 // Si on cache, réinitialiser les valeurs de condition
                if (showNewConditionForm) {
                    setNewConditionType(undefined);
                    setNewConditionValue('');
                }
            },
            showNewConditionForm
        )}
       </div>
    </div>
  );
};

export default RuleEditor;