// Nouveaux types pour les conditions
export type ConditionType =
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS';

// Nouveaux types pour les règles
export type RuleType =
  | 'TO_UPPERCASE'
  | 'TO_LOWERCASE'
  | 'ADD_PREFIX'
  | 'ADD_SUFFIX'
  | 'MULTIPLY_BY'
  | 'REPLACE_TEXT'
  | 'ADJUST_PERCENTAGE'
  | 'SET_MAX_VALUE'
  | 'SET_MIN_VALUE';

export interface Rule {
  id: string;
  type: RuleType;
  value?: string | number;
  searchValue?: string;
  replaceValue?: string;
  conditionType?: ConditionType;
  conditionValue?: string | number;
  order: number; // Champ ajouté pour l'ordre
}

export interface ColumnConfig {
  id: string;
  name: string;
  displayName: string;
  order: number;
  required: boolean;
  rules: Rule[]; // Utilise la nouvelle interface Rule
}

export interface Campaign {
  id?: number | string | undefined;
  name: string;
  description: string;
  columns: ColumnConfig[];
  output_file_name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadState {
  isUploading: boolean;
  success: boolean;
  error: string | null;
  progress: number;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export type DataRow = Record<string, any>;