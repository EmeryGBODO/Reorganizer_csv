import axios from 'axios';
import { Campaign, UserCredentials, Agent, DataRow } from '../types'; 

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authApi = {
  login: async (credentials: UserCredentials) => {
    // ... (inchangé)
    await delay(1000);
    if (credentials.email === 'admin@example.com' && credentials.password === 'password123') {
      return {
        data: {
          success: true,
          token: 'fake-jwt-token',
          message: 'Login successful'
        }
      };
    }
    throw new Error('Invalid credentials');
  }
};

// --- API des Campagnes (maintenant réelle) ---
export const campaignApi = {
  getAll: () => api.get<Campaign[]>('/campaigns'), 
  create: (campaignData: Campaign) => api.post<Campaign>('/campaigns/', campaignData),
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

// NOUVEAUX SERVICES AJOUTÉS
export const dataApi = {
    getAgents: async (): Promise<{ data: { success: boolean, data: Agent[] } }> => {
        await delay(400);
        return { data: { success: true, data: mockAgents } };
    },
    generateDataFromServer: async (params: { startDate: string, endDate: string }): Promise<{ data: { success: boolean, data: DataRow[] } }> => {
        await delay(1500);
        // Dans une vraie application, vous filtreriez les données en fonction des paramètres
        console.log("Fetching data with params:", params);
        return { data: { success: true, data: mockServerData } };
    }
}


export default api;