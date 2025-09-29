export interface Campaign {
  id: string;
  name: string;
  description: string;
  columns: ColumnConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface ColumnConfig {
  id: string;
  name: string;
  displayName: string;
  order: number;
  required: boolean;
}

export interface UploadState {
  isUploading: boolean;
  success: boolean;
  error: string | null;
  progress: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}