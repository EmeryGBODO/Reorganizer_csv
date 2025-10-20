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

// Fonctions de conversion pour REPLACE_TEXT
const convertRulesForBackend = (rules: any[]) => {
  return rules.map(rule => {
    if (rule.type === 'REPLACE_TEXT' && rule.searchValue !== undefined && rule.replaceValue !== undefined) {
      return {
        id: rule.id,
        type: rule.type,
        value: `${rule.searchValue}|${rule.replaceValue}`
      };
    }
    return {
      id: rule.id,
      type: rule.type,
      value: rule.value
    };
  });
};

const convertRulesFromBackend = (rules: any[]) => {
  return rules.map(rule => {
    if (rule.type === 'REPLACE_TEXT' && rule.value && typeof rule.value === 'string' && rule.value.includes('|')) {
      const [searchValue, replaceValue] = rule.value.split('|');
      return {
        ...rule,
        searchValue,
        replaceValue,
        value: undefined
      };
    }
    return rule;
  });
};

// --- API des Campagnes (maintenant réelle) ---
export const campaignApi = {
  getAll: async () => {
    const response = await api.get<Campaign[]>('/api/campaigns');
    // Convertir les règles REPLACE_TEXT du backend vers le frontend
    if (response.data) {
      response.data = response.data.map(campaign => ({
        ...campaign,
        columns: campaign.columns?.map(col => ({
          ...col,
          rules: convertRulesFromBackend(col.rules || [])
        }))
      }));
    }
    return response;
  },
  create: (campaignData: Campaign) => {
    console.log("campaign created🤞✌", campaignData);
    // Convertir les règles pour le backend
    const backendData = {
      ...campaignData,
      columns: campaignData.columns?.map(col => ({
        ...col,
        rules: convertRulesForBackend(col.rules || [])
      }))
    };
    return api.post<Campaign>('/api/campaigns/', backendData);
  },
  update: (id: string | number, campaignData: Partial<Campaign>) => {
    console.log("Campaign updated", campaignData);
    // Convertir les règles pour le backend
    const backendData = {
      ...campaignData,
      columns: campaignData.columns?.map(col => ({
        ...col,
        rules: convertRulesForBackend(col.rules || [])
      }))
    };
    return api.put<Campaign>(`/api/campaigns/${id}/`, backendData);
  },
  delete: (id: string | number) => api.delete(`/api/campaigns/${id}/`),
};

// --- API de Traitement de Fichier (maintenant réelle) ---
export const fileApi = {
  processCSV: async (file: File | null, campaignId: string | number) => {
    const formData = new FormData();
    if (file != null) {
      formData.append('file', file);
    }
    
    try {
      const response = await api.post(`/api/process-file/${campaignId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
      });

      // Vérifier le type de contenu de la réponse
      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('application/json')) {
        // C'est une erreur JSON, convertir le blob en texte puis parser
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        return errorData
      }
      
      // C'est bien un fichier blob
      return response;
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors du traitement du fichier');
    }
  }
}

export const dataApi = {
    getAgents: async (): Promise<{ data: { success: boolean, data: Agent[] } }> => {
        await delay(400);
        return { data: { success: true, data: mockAgents } };
    },
    // --- FONCTION MISE À JOUR ---
    generateDataFromServer: async (
      startDate: string,
      endDate: string
    ): Promise<{ data: { success: boolean, data: DataRow[] } }> => {
        await delay(1500);
        
        // Log pour vérifier que les dates sont bien reçues
        console.log(`Récupération des données entre le ${startDate} et le ${endDate}`);

        // Dans une vraie application, vous feriez :
        const response = await api.get(`/api/remote-data/?beginDate=${startDate}&endDate=${endDate}`);
        return response;

    }
}

export default api;