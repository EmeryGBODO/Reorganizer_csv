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
  | 'ADJUST_PERCENTAGE' // Ajouté
  | 'SET_MAX_VALUE'     // Ajouté
  | 'SET_MIN_VALUE';    // Ajouté

export interface Rule {
  id: string;
  type: RuleType; // Type mis à jour
  value?: string | number;
  searchValue?: string;
  replaceValue?: string;
  // Champs conditionnels ajoutés (optionnels)
  conditionType?: ConditionType;
  conditionValue?: string | number;
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