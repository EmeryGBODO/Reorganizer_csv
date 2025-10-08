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

export const campaignApi = {
    getAll: async () => {
        await delay(500);
        return {
          data: {
            success: true,
            data: mockCampaigns,
            message: 'Campaigns retrieved successfully'
          }
        };
      },
      // ... (le reste de votre fichier api.ts reste inchangé)
      getById: async (id: string) => {
        await delay(300);
        const campaign = mockCampaigns.find(c => c.id === id);
        if (!campaign) {
          throw new Error('Campaign not found');
        }
        return {
          data: {
            success: true,
            data: campaign,
            message: 'Campaign retrieved successfully'
          }
        };
      },
      create: async (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
        await delay(800);
        const newCampaign: Campaign = {
          ...campaign,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockCampaigns.push(newCampaign);
        return {
          data: {
            success: true,
            data: newCampaign,
            message: 'Campaign created successfully'
          }
        };
      },
      update: async (id: string, campaign: Partial<Campaign>) => {
        await delay(600);
        const index = mockCampaigns.findIndex(c => c.id === id);
        if (index === -1) {
          throw new Error('Campaign not found');
        }
        const updatedCampaign = {
          ...mockCampaigns[index],
          ...campaign,
          updatedAt: new Date().toISOString(),
        };
        mockCampaigns[index] = updatedCampaign;
        return {
          data: {
            success: true,
            data: updatedCampaign,
            message: 'Campaign updated successfully'
          }
        };
      },
      delete: async (id: string) => {
        await delay(400);
        const index = mockCampaigns.findIndex(c => c.id === id);
        if (index === -1) {
          throw new Error('Campaign not found');
        }
        mockCampaigns.splice(index, 1);
        return {
          data: {
            success: true,
            data: undefined,
            message: 'Campaign deleted successfully'
          }
        };
      },
};

export const fileApi = {
  // ... (inchangé)
  processCSV: (file: File, campaignId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('campaignId', campaignId);
    
    return api.post<Blob>('/files/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        return percentCompleted;
      },
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