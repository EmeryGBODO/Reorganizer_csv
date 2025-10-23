import { Rule, ColumnConfig, ConditionType } from '../types';

// Fonction pour évaluer une condition
const evaluateCondition = (value: any, conditionType?: ConditionType, conditionValue?: string | number): boolean => {
  if (!conditionType || conditionValue === undefined) {
    return true; // Pas de condition, la règle s'applique toujours
  }

  const strValue = String(value).toLowerCase();
  const strConditionValue = String(conditionValue).toLowerCase();
  const numValue = parseFloat(String(value));
  const numConditionValue = parseFloat(String(conditionValue));

  switch (conditionType) {
    case 'GREATER_THAN':
      return !isNaN(numValue) && !isNaN(numConditionValue) && numValue > numConditionValue;
    case 'LESS_THAN':
      return !isNaN(numValue) && !isNaN(numConditionValue) && numValue < numConditionValue;
    case 'EQUALS':
      // Comparaison numérique si possible, sinon textuelle
      if (!isNaN(numValue) && !isNaN(numConditionValue)) {
        return numValue === numConditionValue;
      }
      return strValue === strConditionValue;
    case 'NOT_EQUALS':
       if (!isNaN(numValue) && !isNaN(numConditionValue)) {
        return numValue !== numConditionValue;
      }
      return strValue !== strConditionValue;
    case 'CONTAINS':
      return strValue.includes(strConditionValue);
    case 'NOT_CONTAINS':
      return !strValue.includes(strConditionValue);
    default:
      return true; // Condition inconnue, on applique la règle par défaut
  }
};


export const applyRules = (value: any, rules: Rule[]): any => {
  let result: string | number = String(value ?? ''); // Assurer une valeur initiale string, même pour null/undefined

  for (const rule of rules) {
    // --- Évaluation de la condition ---
    if (!evaluateCondition(result, rule.conditionType, rule.conditionValue)) {
      continue; // Si la condition n'est pas remplie, on saute cette règle
    }
    // --- Application de la règle ---
    let currentResultAsString = String(result);
    let currentResultAsNumber = parseFloat(currentResultAsString);

    switch (rule.type) {
      case 'TO_UPPERCASE':
        result = currentResultAsString.toUpperCase();
        break;
      case 'TO_LOWERCASE':
        result = currentResultAsString.toLowerCase();
        break;
      case 'ADD_PREFIX':
        result = `${rule.value}${currentResultAsString}`;
        break;
      case 'ADD_SUFFIX':
        result = `${currentResultAsString}${rule.value}`;
        break;
      case 'MULTIPLY_BY':
        if (!isNaN(currentResultAsNumber) && rule.value !== undefined) {
          result = currentResultAsNumber * Number(rule.value);
        }
        break;
      case 'REPLACE_TEXT':
        // Gérer les deux formats : searchValue/replaceValue OU value avec "ancien|nouveau"
        let search = '';
        let replace = '';
        if (rule.searchValue !== undefined && rule.replaceValue !== undefined) {
          search = rule.searchValue;
          replace = rule.replaceValue;
        } else if (rule.value && typeof rule.value === 'string' && rule.value.includes('|')) {
          [search, replace] = rule.value.split('|');
        }
        if (search) {
            // Utiliser une regex pour le remplacement global, en échappant les caractères spéciaux
             const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             result = currentResultAsString.replace(new RegExp(escapedSearch, 'g'), replace || '');
        }
        break;
       // --- Nouvelles règles ---
       case 'ADJUST_PERCENTAGE':
            if (!isNaN(currentResultAsNumber) && rule.value !== undefined) {
                const percentage = Number(rule.value) / 100;
                result = currentResultAsNumber * (1 + percentage);
            }
            break;
       case 'SET_MAX_VALUE':
            if (!isNaN(currentResultAsNumber) && rule.value !== undefined) {
                 result = Math.min(currentResultAsNumber, Number(rule.value));
            }
            break;
        case 'SET_MIN_VALUE':
            if (!isNaN(currentResultAsNumber) && rule.value !== undefined) {
                result = Math.max(currentResultAsNumber, Number(rule.value));
            }
            break;
    }
     // S'assurer que le résultat final est une chaîne pour la prochaine itération, sauf si c'était un nombre valide
     // Cela évite les erreurs si une règle textuelle suit une règle numérique
     if (typeof result === 'number' && !isNaN(result)) {
         // Conserver le nombre si c'est valide
     } else {
       result = String(result);
     }
  }

  return result;
};

export const processDataWithRules = (
  data: Record<string, any>[],
  columns: ColumnConfig[]
): Record<string, any>[] => {
  if (!columns || columns.length === 0) {
      return data; // Retourner les données originales si aucune colonne de config n'est fournie
  }

  const columnsWithRules = columns.filter(col => col.rules && col.rules.length > 0);
   if (columnsWithRules.length === 0) {
      return data; // Retourner les données originales si aucune colonne n'a de règles
  }

  return data.map(row => {
    const processedRow = { ...row };

    columnsWithRules.forEach(column => {
        // Vérifier si la colonne existe dans la ligne avant d'appliquer les règles
        if (row.hasOwnProperty(column.name)) {
             processedRow[column.name] = applyRules(row[column.name], column.rules);
        }
    });

    return processedRow;
  });
};