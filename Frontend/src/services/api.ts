import axios from 'axios';
import { Campaign } from '../types';

const API_BASE_URL = 'http://localhost:8000/api'; // J'ai mis 8000 qui est le port par défaut pour FastAPI

// Données mock corrigées pour correspondre au type ColumnConfig
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Campagne Marketing Q1',
    description: 'Réorganisation des données marketing Q1',
    columns: [
      { id: 'col-1', name: 'name', displayName: 'Nom', order: 0, required: true },
      { id: 'col-2', name: 'email', displayName: 'Email', order: 1, required: true },
      { id: 'col-3', name: 'phone', displayName: 'Téléphone', order: 2, required: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Export Clients',
    description: 'Format standard pour export clients',
    columns: [
      { id: 'col-4', name: 'firstname', displayName: 'Prénom', order: 0, required: true },
      { id: 'col-5', name: 'lastname', displayName: 'Nom de famille', order: 1, required: true },
      { id: 'col-6', name: 'email', displayName: 'Adresse email', order: 2, required: true },
      { id: 'col-7', name: 'age', displayName: 'Age', order: 3, required: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Campaign API calls
export const campaignApi = {
  getAll: async () => {
    await delay(500); // Simulate network delay
    return {
      data: {
        success: true,
        data: mockCampaigns,
        message: 'Campaigns retrieved successfully'
      }
    };
  },
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

// File processing API calls
export const fileApi = {
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

export default api;