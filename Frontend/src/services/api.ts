import axios from 'axios';
import { Campaign, UserCredentials } from '../types';

// URL de base de votre API backend. Assurez-vous que votre backend tourne sur le port 8000.
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Augmentation du timeout pour les uploads de fichiers plus lourds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- API d'Authentification (maintenant réelle) ---
export const authApi = {
  login: (credentials: UserCredentials) => {
    // FastAPI attend les données de formulaire pour l'authentification par token
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
};

// --- API des Campagnes (maintenant réelle) ---
export const campaignApi = {
  getAll: () => api.get<Campaign[]>('/campaigns'), 
  create: (campaignData: Campaign) => api.post<Campaign>('/campaigns', campaignData),
  update: (id: string, campaignData: Partial<Campaign>) => api.put<Campaign>(`/campaigns/${id}`, campaignData),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

// --- API de Traitement de Fichier (maintenant réelle) ---
export const fileApi = {
  processCSV: (file: File, campaignId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    console.log(campaignId);
    console.log(formData);
    console.log(file);
    
    return api.post<Blob>(`/process/${campaignId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob', // Important pour recevoir le fichier en retour
    });
  },
};

export default api;