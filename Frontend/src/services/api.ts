import axios from 'axios';
import { Campaign, UserCredentials, Agent, DataRow } from '../types'; 

export const API_BASE_URL = import.meta.env.VITE_API_URL

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
      output_file_name: "output",
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
      output_file_name: "output",
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
    { id: 1, agent: 'Jean Dupont', date: '2023-10-01', product: 'Box Fibre', revenue: 29.99, campaign_id: '1' },
    { id: 2, agent: 'Marie Curie', date: '2023-10-01', product: 'Mobile 5G', revenue: 19.99, campaign_id: '1' },
    { id: 3, agent: 'Jean Dupont', date: '2023-10-02', product: 'Mobile 4G', revenue: 9.99, campaign_id: '1' },
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
  getAll: () => api.get<Campaign[]>('/api/campaigns'), 
  create: (campaignData: Campaign) =>{
    console.log("campaign created🤞✌", campaignData);
    return api.post<Campaign>('/api/campaigns/', campaignData)},
  update: (id: string | number, campaignData: Partial<Campaign>) => {
    console.log("Campaign updated", campaignData);
    
    return api.put<Campaign>(`/api/campaigns/${id}/`, campaignData)},
  delete: (id: string | number) => api.delete(`/api/campaigns/${id}/`),
};

// --- API de Traitement de Fichier (maintenant réelle) ---
export const fileApi = {
  processCSV: (file: File | null, campaignId: string | number) => {
    const formData = new FormData();
    if (file!=null) {
      formData.append('file', file);
    }
    console.log(campaignId);
    console.log(formData);
    console.log(file);
    
    return api.post<Blob>(`/api/process-file/${campaignId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob', // Important pour recevoir le fichier en retour
    });
  }
}

export const dataApi = {
    getAgents: async (): Promise<{ data: { success: boolean, data: Agent[] } }> => {
        await delay(400);
        return { data: { success: true, data: mockAgents } };
    },
    // --- FONCTION MISE À JOUR ---
    generateDataFromServer: async (
      campaignId: string | number,
      startDate: string,
      endDate: string
    ): Promise<{ data: { success: boolean, data: DataRow[] } }> => {
        await delay(1500);
        
        // Log pour vérifier que les dates sont bien reçues
        console.log(`Récupération des données pour la campagne ID: ${campaignId} entre le ${startDate} et le ${endDate}`);

        // Dans une vraie application, vous feriez :
        // const response = await api.get(`/api/remote-data/${campaignId}/`, { 
        //   params: { start_date: startDate, end_date: endDate }
        // });
        // return response.data;

        // Simulation : on filtre les données mockées par campagne ET par date
        const data = mockServerData.filter(row => {
            const rowDate = new Date(row.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return row.campaign_id === campaignId && rowDate >= start && rowDate <= end;
        });
        
        // Retourne les données filtrées, ou un tableau vide si rien ne correspond
        return { data: { success: true, data: data } }; 
    }
}

export default api;