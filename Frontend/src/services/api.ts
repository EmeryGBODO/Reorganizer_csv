import axios from 'axios';
import { Campaign, UserCredentials, Agent, DataRow } from '../types'; 

const API_BASE_URL = 'http://localhost:8000/api';

// ... (données mock existantes)
const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Campagne Marketing Q1',
      description: 'Réorganisation des données marketing Q1',
      columns: [
        { id: 'col-1', name: 'name', displayName: 'Nom', order: 0, required: true, rules: [] },
        { id: 'col-2', name: 'email', displayName: 'Email', order: 1, required: true, rules: [] },
        { id: 'col-3', name: 'phone', displayName: 'Téléphone', order: 2, required: false, rules: [] },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Export Clients',
      description: 'Format standard pour export clients',
      columns: [
        { id: 'col-4', name: 'firstname', displayName: 'Prénom', order: 0, required: true, rules: [] },
        { id: 'col-5', name: 'lastname', displayName: 'Nom de famille', order: 1, required: true, rules: [] },
        { id: 'col-6', name: 'email', displayName: 'Adresse email', order: 2, required: true, rules: [] },
        { id: 'col-7', name: 'age', displayName: 'Age', order: 3, required: false, rules: [] },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

const mockAgents: Agent[] = [
    { id: 'agent-1', name: 'Jean Dupont' },
    { id: 'agent-2', name: 'Marie Curie' },
    { id: 'agent-3', name: 'Pierre Martin' },
];

const mockServerData: DataRow[] = [
    { id: 1, agent: 'Jean Dupont', date: '2023-10-01', product: 'Box Fibre', revenue: 29.99 },
    { id: 2, agent: 'Marie Curie', date: '2023-10-01', product: 'Mobile 5G', revenue: 19.99 },
    { id: 3, agent: 'Jean Dupont', date: '2023-10-02', product: 'Mobile 4G', revenue: 9.99 },
    { id: 4, agent: 'Pierre Martin', date: '2023-10-03', product: 'Box Fibre', revenue: 29.99, campaign_id: '1' },
    { id: 5, agent: 'Marie Curie', date: '2023-10-04', product: 'Mobile 5G', revenue: 24.99, campaign_id: '2' },
];


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

export const dataApi = {
    getAgents: async (): Promise<{ data: { success: boolean, data: Agent[] } }> => {
        await delay(400);
        return { data: { success: true, data: mockAgents } };
    },
    // --- FONCTION MISE À JOUR ---
    generateDataFromServer: async (campaignId: string): Promise<{ data: { success: boolean, data: DataRow[] } }> => {
        await delay(1500);
        console.log(`Récupération des données pour la campagne ID: ${campaignId}`);

        // Dans une vraie application, vous feriez :
        // const response = await api.get(`/remote-data/${campaignId}/`);
        // return response.data;

        // Simulation : on filtre les données mockées
        const data = mockServerData.filter(row => row.campaign_id === campaignId);
        
        return { data: { success: true, data: data.length > 0 ? data : mockServerData } }; // Retourne toutes les données si le filtre ne trouve rien
    }
}

export default api;