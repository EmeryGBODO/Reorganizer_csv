import axios from 'axios';
import { Campaign, UserCredentials, DataRow } from '../types'; 

export const API_BASE_URL = import.meta.env.VITE_API_URL



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
        value: `${rule.searchValue}|${rule.replaceValue}`,
        conditionType: rule.conditionType,
        conditionValue: rule.conditionValue
      };
    }
    return {
      id: rule.id,
      type: rule.type,
      value: rule.value,
      conditionType: rule.conditionType,
      conditionValue: rule.conditionValue
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
        value: undefined,
        conditionType: rule.conditionType,
        conditionValue: rule.conditionValue
      };
    }
    return rule;
  });
};

// --- API des Campagnes (maintenant réelle) ---
export const campaignApi = {
  getAll: async () => {
    const response = await api.get<Campaign[]>('/api/csvflow/campaigns');
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
    return api.post<Campaign>('/api/csvflow/campaigns/', backendData);
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
    return api.put<Campaign>(`/api/csvflow/campaigns/${id}/`, backendData);
  },
  delete: (id: string | number) => api.delete(`/api/csvflow/campaigns/${id}/`),
};

// --- API de Traitement de Fichier (maintenant réelle) ---
export const fileApi = {
  processCSV: async (file: File | null, campaignId: string | number) => {
    const formData = new FormData();
    if (file != null) {
      formData.append('file', file);
    }
    
    try {
      const response = await api.post(`/api/csvflow/process-file/${campaignId}/`, formData, {
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
    
    // --- FONCTION MISE À JOUR ---
    generateDataFromServer: async (
      startDate: string,
      endDate: string
    ): Promise<{ data: { success: boolean, data: DataRow[] } }> => {
        await delay(1500);
        
        // Log pour vérifier que les dates sont bien reçues
        console.log(`Récupération des données entre le ${startDate} et le ${endDate}`);

        // Dans une vraie application, vous feriez :
        const response = await api.get(`/api/csvflow/remote-data/?beginDate=${startDate}&endDate=${endDate}`);
        return response;

    }
}

export default api;