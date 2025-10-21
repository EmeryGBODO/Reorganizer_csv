import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { Rule } from '../types';

interface RuleEditorProps {
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

type RuleType = Rule['type'];

const ruleOptions: { value: RuleType; label: string; needsValue: boolean }[] = [
  { value: 'TO_UPPERCASE', label: 'Mettre en majuscules', needsValue: false },
  { value: 'TO_LOWERCASE', label: 'Mettre en minuscules', needsValue: false },
  { value: 'ADD_PREFIX', label: 'Ajouter un préfixe', needsValue: true },
  { value: 'ADD_SUFFIX', label: 'Ajouter un suffixe', needsValue: true },
  { value: 'MULTIPLY_BY', label: 'Multiplier par', needsValue: true },
  { value: 'REPLACE_TEXT', label: 'Remplacer le texte', needsValue: true },
];

const RuleEditor: React.FC<RuleEditorProps> = ({ rules, onRulesChange }) => {
  const [newRuleType, setNewRuleType] = useState<RuleType>('TO_UPPERCASE');
  const [newRuleValue, setNewRuleValue] = useState<string | number>('');
  const [newSearchValue, setNewSearchValue] = useState('');
  const [newReplaceValue, setNewReplaceValue] = useState('');

  // State for editing an existing rule
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const selectedRuleConfig = ruleOptions.find(opt => opt.value === newRuleType);

  useEffect(() => {
    if (editingRuleId) {
      const ruleToEdit = rules.find(r => r.id === editingRuleId);
      setEditingRule(ruleToEdit || null);
    } else {
      setEditingRule(null);
    }
  }, [editingRuleId, rules]);

  const handleAddRule = () => {
    if (!newRuleType) return;
    if (newRuleType === 'REPLACE_TEXT' && !newReplaceValue) return;
    if (selectedRuleConfig?.needsValue && newRuleType !== 'REPLACE_TEXT' && !newRuleValue) return;

    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      type: newRuleType,
      ...(newRuleType === 'REPLACE_TEXT' 
        ? { searchValue: newSearchValue, replaceValue: newReplaceValue }
        : { value: selectedRuleConfig?.needsValue ? newRuleValue : undefined }
      )
    };

    onRulesChange([...rules, newRule]);
    setNewRuleValue('');
    setNewSearchValue('');
    setNewReplaceValue('');
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRuleId(rule.id);
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;
    
    // Validation pour REPLACE_TEXT
    if (editingRule.type === 'REPLACE_TEXT') {
      if (!editingRule.searchValue?.trim() || !editingRule.replaceValue?.trim()) {
        alert('Les deux champs "Texte à chercher" et "Texte à remplacer" doivent être remplis.');
        return;
      }
    }
    
    // S'assurer que les règles REPLACE_TEXT ont les bonnes propriétés
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
    
    onRulesChange(rules.map(rule => (rule.id === editingRule.id ? updatedRule : rule)));
    setEditingRuleId(null);
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const getRuleDescription = (rule: Rule) => {
    const option = ruleOptions.find(opt => opt.value === rule.type);
    if (!option) return 'Règle inconnue';
    if (!option.needsValue) return option.label;
    if (rule.type === 'REPLACE_TEXT') {
      const searchValue = rule.searchValue || '';
      const replaceValue = rule.replaceValue || '';
      return `${option.label} : "${searchValue}" → "${replaceValue}"`;
    }
    return `${option.label} : "${rule.value}"`;
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
                <div className="flex items-center gap-2">
                  <select
                    value={editingRule.type}
                    onChange={(e) => {
                      const newType = e.target.value as RuleType;
                      const config = ruleOptions.find(opt => opt.value === newType);
                      if (newType === 'REPLACE_TEXT') {
                        setEditingRule({ 
                          ...editingRule, 
                          type: newType, 
                          searchValue: editingRule.searchValue || '', 
                          replaceValue: editingRule.replaceValue || '',
                          value: undefined 
                        });
                      } else {
                        setEditingRule({ 
                          ...editingRule, 
                          type: newType, 
                          value: config?.needsValue ? editingRule.value || '' : undefined,
                          searchValue: undefined,
                          replaceValue: undefined
                        });
                      }
                    }}
                    className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
                  >
                    {ruleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {editingRule.type === 'REPLACE_TEXT' ? (
                    <>
                      <input
                        placeholder="Texte à chercher"
                        value={editingRule.searchValue || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, searchValue: e.target.value })}
                        className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Texte à remplacer"
                        value={editingRule.replaceValue || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, replaceValue: e.target.value })}
                        className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
                      />
                    </>
                  ) : (
                    ruleOptions.find(opt => opt.value === editingRule.type)?.needsValue && (
                      <input
                        type={editingRule.type === 'MULTIPLY_BY' ? 'number' : 'text'}
                        value={editingRule.value || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, value: e.target.value })}
                        className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
                        placeholder="Valeur"
                      />
                    )
                  )}

                  <button onClick={handleSaveEdit} className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"><Check className="h-4 w-4" /></button>
                  <button onClick={handleCancelEdit} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>
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
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <select
          value={newRuleType}
          onChange={(e) => setNewRuleType(e.target.value as RuleType)}
          className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
        >
          {ruleOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {newRuleType === 'REPLACE_TEXT' ? (
          <>
            <input 
              placeholder="Texte à chercher" 
              value={newSearchValue}
              onChange={(e) => setNewSearchValue(e.target.value)}
              className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm" 
            />
            <input 
              placeholder="Texte à remplacer" 
              value={newReplaceValue}
              onChange={(e) => setNewReplaceValue(e.target.value)}
              className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm" 
            />
          </>
        ) : (
          selectedRuleConfig?.needsValue && (
            <input
              type={newRuleType === 'MULTIPLY_BY' ? 'number' : 'text'}
              value={newRuleValue}
              onChange={(e) => setNewRuleValue(e.target.value)}
              className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-2 py-1 text-sm"
              placeholder="Valeur"
            />
          )
        )}

        <button
          onClick={handleAddRule}
          className="p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          title="Ajouter la règle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default RuleEditor;