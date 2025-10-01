export interface Rule {
  id: string;
  type: 'TO_UPPERCASE' | 'TO_LOWERCASE' | 'ADD_PREFIX' | 'ADD_SUFFIX' | 'MULTIPLY_BY' | 'REPLACE_TEXT';
  value?: string | number;
}

export interface ColumnConfig {
  id: string;
  name: string;
  displayName: string;
  order: number;
  required: boolean;
  rules: Rule[]; // Ajout du tableau de règles
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  columns: ColumnConfig[];
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