import { Rule, ColumnConfig } from '../types';

export const applyRules = (value: any, rules: Rule[]): any => {
  let result = String(value);
  
  for (const rule of rules) {
    switch (rule.type) {
      case 'TO_UPPERCASE':
        result = result.toUpperCase();
        break;
      case 'TO_LOWERCASE':
        result = result.toLowerCase();
        break;
      case 'ADD_PREFIX':
        result = `${rule.value}${result}`;
        break;
      case 'ADD_SUFFIX':
        result = `${result}${rule.value}`;
        break;
      case 'MULTIPLY_BY':
        const num = parseFloat(result);
        if (!isNaN(num) && rule.value) {
          result = String(num * Number(rule.value));
        }
        break;
      case 'REPLACE_TEXT':
        // Gérer les deux formats : searchValue/replaceValue OU value avec "ancien|nouveau"
        if (rule.searchValue !== undefined && rule.replaceValue !== undefined) {
          result = result.replace(new RegExp(rule.searchValue, 'g'), rule.replaceValue);
        } else if (rule.value && typeof rule.value === 'string' && rule.value.includes('|')) {
          const [searchValue, replaceValue] = rule.value.split('|');
          if (searchValue) {
            result = result.replace(new RegExp(searchValue, 'g'), replaceValue || '');
          }
        }
        break;
    }
  }
  
  return result;
};

export const processDataWithRules = (
  data: Record<string, any>[],
  columns: ColumnConfig[]
): Record<string, any>[] => {
  return data.map(row => {
    const processedRow = { ...row };
    
    columns.forEach(column => {
      if (column.rules && column.rules.length > 0) {
        processedRow[column.name] = applyRules(row[column.name], column.rules);
      }
    });
    
    return processedRow;
  });
};