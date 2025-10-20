export interface Rule {
  id: string;
  type: 'TO_UPPERCASE' | 'TO_LOWERCASE' | 'ADD_PREFIX' | 'ADD_SUFFIX' | 'MULTIPLY_BY' | 'REPLACE_TEXT';
  value?: string | number;
  searchValue?: string;
  replaceValue?: string;
}

export interface ColumnConfig {
  id: string;
  name: string;
  displayName: string;
  order: number;
  required: boolean;
  rules: Rule[];
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

// NOUVEAUX TYPES AJOUTÉS
export interface Agent {
    id: string;
    name: string;
}

export type DataRow = Record<string, any>;