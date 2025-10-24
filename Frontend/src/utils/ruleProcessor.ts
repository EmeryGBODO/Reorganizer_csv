import { Rule, ColumnConfig, ConditionType } from '../types';

// Fonction pour évaluer une condition (inchangée)
const evaluateCondition = (value: any, conditionType?: ConditionType, conditionValue?: string | number): boolean => {
  if (!conditionType || conditionValue === undefined || conditionValue === null) { // Vérifier aussi null
    return true;
  }
  const strValue = String(value ?? '').toLowerCase(); // Utiliser ?? '' pour les null/undefined
  const strConditionValue = String(conditionValue ?? '').toLowerCase();
  const numValue = parseFloat(String(value));
  const numConditionValue = parseFloat(String(conditionValue));

  switch (conditionType) {
    case 'GREATER_THAN':
      return !isNaN(numValue) && !isNaN(numConditionValue) && numValue > numConditionValue;
    case 'LESS_THAN':
      return !isNaN(numValue) && !isNaN(numConditionValue) && numValue < numConditionValue;
    case 'EQUALS':
      if (!isNaN(numValue) && !isNaN(numConditionValue)) return numValue === numConditionValue;
      return strValue === strConditionValue;
    case 'NOT_EQUALS':
       if (!isNaN(numValue) && !isNaN(numConditionValue)) return numValue !== numConditionValue;
      return strValue !== strConditionValue;
    case 'CONTAINS':
      return strValue.includes(strConditionValue);
    case 'NOT_CONTAINS':
      return !strValue.includes(strConditionValue);
    default:
      return true;
  }
};


export const applyRules = (value: any, rules: Rule[]): any => {
  let result: string | number = String(value ?? ''); // Assurer une valeur initiale string

  // --- TRIER LES RÈGLES PAR ORDRE ---
  const sortedRules = [...rules].sort((a, b) => a.order - b.order);

  // --- Appliquer les règles triées ---
  for (const rule of sortedRules) { // Utiliser sortedRules
    if (!evaluateCondition(result, rule.conditionType, rule.conditionValue)) {
      continue;
    }

    let currentResultAsString = String(result);
    let currentResultAsNumber = parseFloat(currentResultAsString);

    switch (rule.type) {
        // Cas TO_UPPERCASE, TO_LOWERCASE, ADD_PREFIX, ADD_SUFFIX (inchangés)
        case 'TO_UPPERCASE': result = currentResultAsString.toUpperCase(); break;
        case 'TO_LOWERCASE': result = currentResultAsString.toLowerCase(); break;
        case 'ADD_PREFIX': result = `${rule.value ?? ''}${currentResultAsString}`; break; // Utiliser ?? ''
        case 'ADD_SUFFIX': result = `${currentResultAsString}${rule.value ?? ''}`; break; // Utiliser ?? ''

        // Cas MULTIPLY_BY (vérifier si value est un nombre)
        case 'MULTIPLY_BY':
            const multiplyValue = Number(rule.value);
            if (!isNaN(currentResultAsNumber) && !isNaN(multiplyValue)) {
              result = currentResultAsNumber * multiplyValue;
            }
            break;

        // Cas REPLACE_TEXT (inchangé, mais plus robuste avec ?? '')
        case 'REPLACE_TEXT':
            let search = rule.searchValue ?? '';
            let replace = rule.replaceValue ?? '';
            // Gérer l'ancien format pour la compatibilité backend si nécessaire (pas idéal ici)
            // if (!search && rule.value && typeof rule.value === 'string' && rule.value.includes('|')) {
            //   [search, replace] = rule.value.split('|');
            // }
            if (search) {
                 const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 result = currentResultAsString.replace(new RegExp(escapedSearch, 'g'), replace);
            }
            break;

       // Cas ADJUST_PERCENTAGE (vérifier si value est un nombre)
       case 'ADJUST_PERCENTAGE':
            const percentageValue = Number(rule.value);
            if (!isNaN(currentResultAsNumber) && !isNaN(percentageValue)) {
                result = currentResultAsNumber * (1 + (percentageValue / 100));
            }
            break;

       // Cas SET_MAX_VALUE (vérifier si value est un nombre)
       case 'SET_MAX_VALUE':
             const maxValue = Number(rule.value);
             if (!isNaN(currentResultAsNumber) && !isNaN(maxValue)) {
                 result = Math.min(currentResultAsNumber, maxValue);
             }
             break;

        // Cas SET_MIN_VALUE (vérifier si value est un nombre)
        case 'SET_MIN_VALUE':
            const minValue = Number(rule.value);
            if (!isNaN(currentResultAsNumber) && !isNaN(minValue)) {
                result = Math.max(currentResultAsNumber, minValue);
            }
            break;
    }

     // Conserver le type nombre si possible après calcul
     if (typeof result !== 'number') {
       result = String(result);
     }
  }

  return result;
};

// Fonction processDataWithRules (inchangée)
export const processDataWithRules = (
  data: Record<string, any>[],
  columns: ColumnConfig[]
): Record<string, any>[] => {
  if (!columns || columns.length === 0) return data;
  const columnsWithRules = columns.filter(col => col.rules && col.rules.length > 0);
  if (columnsWithRules.length === 0) return data;

  return data.map(row => {
    const processedRow = { ...row };
    columnsWithRules.forEach(column => {
        if (Object.prototype.hasOwnProperty.call(row, column.name)) { // Utiliser Object.prototype.hasOwnProperty.call
             processedRow[column.name] = applyRules(row[column.name], column.rules);
        }
    });
    return processedRow;
  });
};