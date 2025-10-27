import axios from 'axios';
import { Campaign, UserCredentials, DataRow, Rule } from '../types'; // Importer Rule

export const API_BASE_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth API (inchangée) ---
export const authApi = { /* ... */ };

// --- Fonctions de conversion pour les règles ---
const convertRulesForBackend = (rules: Rule[]): any[] => { // Utiliser Rule[] en entrée
  return rules.map(rule => {
    // Copier les propriétés communes
    const backendRule: any = {
      id: rule.id,
      type: rule.type,
      order: rule.order, // Ajouter order
      conditionType: rule.conditionType,
      conditionValue: rule.conditionValue,
    };

    // Gérer le cas spécifique de REPLACE_TEXT
    if (rule.type === 'REPLACE_TEXT') {
        // --- MODIFICATION ICI ---
        // Combiner searchValue et replaceValue dans value avec un séparateur '|'
        backendRule.value = `${rule.searchValue ?? ''}|${rule.replaceValue ?? ''}`;
        // Ne PAS envoyer searchValue et replaceValue séparément
    } else {
      backendRule.value = rule.value; // Envoyer la valeur pour les autres types
    }

    // Supprimer les champs undefined ou null pour ne pas les envoyer inutilement
    if (backendRule.conditionType === undefined || backendRule.conditionType === null) delete backendRule.conditionType;
    if (backendRule.conditionValue === undefined || backendRule.conditionValue === null) delete backendRule.conditionValue;
    if (backendRule.value === undefined || backendRule.value === null) delete backendRule.value;


    return backendRule;
  });
};


const convertRulesFromBackend = (rules: any[]): Rule[] => { // Retourner Rule[]
  return (rules || []).map((rule, index) => { // Ajouter un index pour l'ordre par défaut si manquant
    const frontendRule: Partial<Rule> = { // Utiliser Partial<Rule>
      id: rule.id,
      type: rule.type,
      // value: rule.value, // Ne pas prendre directement la valeur brute pour REPLACE_TEXT
      conditionType: rule.conditionType,
      conditionValue: rule.conditionValue,
      order: rule.order ?? index, // Ajouter order (utiliser l'index comme fallback)
    };

    // Gérer le cas spécifique de REPLACE_TEXT
    if (rule.type === 'REPLACE_TEXT' && typeof rule.value === 'string' && rule.value.includes('|')) {
        // --- MODIFICATION ICI ---
        // Séparer la chaîne 'value' pour récupérer searchValue et replaceValue
        const parts = rule.value.split('|');
        frontendRule.searchValue = parts[0] ?? '';
        frontendRule.replaceValue = parts[1] ?? '';
        // Ne pas assigner à frontendRule.value
    } else {
        // Pour les autres types de règles, assigner la valeur normalement
        frontendRule.value = rule.value;
    }


    // S'assurer que les champs non définis sont bien undefined
    if (frontendRule.value === null || frontendRule.value === undefined) delete frontendRule.value;
    if (frontendRule.searchValue === null || frontendRule.searchValue === undefined) delete frontendRule.searchValue;
    if (frontendRule.replaceValue === null || frontendRule.replaceValue === undefined) delete frontendRule.replaceValue;
    if (frontendRule.conditionType === null || frontendRule.conditionType === undefined) delete frontendRule.conditionType;
    if (frontendRule.conditionValue === null || frontendRule.conditionValue === undefined) delete frontendRule.conditionValue;

    return frontendRule as Rule; // Assurer le type final
  });
};


// --- API des Campagnes (mise à jour pour utiliser les nouvelles conversions) ---
export const campaignApi = {
  getAll: async () => {
    const response = await api.get<Campaign[]>('/api/csvflow/campaigns/'); // Ajouter le slash final
    if (response.data) {
      response.data = response.data.map(campaign => ({
        ...campaign,
        columns: (campaign.columns || []).map(col => ({ // Gérer columns potentiellement undefined
          ...col,
          rules: convertRulesFromBackend(col.rules || []) // Gérer rules potentiellement undefined
        }))
      }));
    }
    return response;
  },
  create: async (campaignData: Campaign) => { // Assurer que campaignData a le bon type
    const backendData = {
      ...campaignData,
      columns: (campaignData.columns || []).map(col => ({ // Gérer undefined
        ...col,
        rules: convertRulesForBackend(col.rules || []) // Gérer undefined
      }))
    };
    const response = await api.post<Campaign>('/api/csvflow/campaigns/', backendData); // Ajouter slash final
     // Convertir la réponse pour le frontend
     if (response.data) {
        response.data.columns = (response.data.columns || []).map(col => ({
            ...col,
            rules: convertRulesFromBackend(col.rules || [])
        }));
    }
    return response;
  },
  update: async (id: string | number | undefined, campaignData: Partial<Campaign>) => { // Gérer id potentiellement undefined
     if (id === undefined) throw new Error("ID de campagne manquant pour la mise à jour");
     const backendData = {
      ...campaignData,
      // Convertir seulement si 'columns' est présent dans la mise à jour partielle
      ...(campaignData.columns && {
          columns: campaignData.columns.map(col => ({
              ...col,
              rules: convertRulesForBackend(col.rules || [])
          }))
      })
    };
    const response = await api.put<Campaign>(`/api/csvflow/campaigns/${id}/`, backendData); // Ajouter slash final
     // Convertir la réponse pour le frontend
     if (response.data) {
        response.data.columns = (response.data.columns || []).map(col => ({
            ...col,
            rules: convertRulesFromBackend(col.rules || [])
        }));
    }
    return response;
  },
  delete: (id: string | number) => api.delete(`/api/csvflow/campaigns/${id}/`), // Ajouter slash final
};

// --- API de Traitement de Fichier (inchangée) ---
export const fileApi = {
 processCSV: async (file: File | null, campaignId: string | number) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }

  try {
    const response = await api.post(`/api/csvflow/process-file/${campaignId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur lors du traitement du fichier');
  }
}
};


// --- API de Données (inchangée) ---
export const dataApi = {
    generateDataFromServer: async (
      startDate: string,
      endDate: string,
      campaign: string
    ): Promise<{ data: { success: boolean, data: DataRow[] } }> => {
        await delay(500); // Réduit pour tests
        console.log(`Récupération des données entre le ${startDate} et le ${endDate}`);
        try {
            const response = await api.get<{ success: boolean, data: DataRow[] }>(`/api/csvflow/remote-data/?beginDate=${startDate}&endDate=${endDate}&campaign=${campaign}`); // Ajouter slash final
            return { data: response.data }; // Retourner directement l'objet attendu
        } catch (error) {
            console.error("Erreur lors de la récupération des données serveur:", error);
            // Retourner une structure d'erreur cohérente si possible
            return { data: { success: false, data: [] } };
        }
    }
};

export default api;