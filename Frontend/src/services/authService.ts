import { API_BASE_URL } from "./api";

import { setWithExpiry, getWithExpiry } from "../utils/storage";
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id?: number;
  username: string;
  displayName?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  auth_type?: string;
  role?: string;
  permissions?: string[];
  full_name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
  needs_password_change?: boolean;
  user_email?: string;
}

// const navigate = useNavigate();

export const authService = {  
  async login(credentials: LoginCredentials, isLdap: boolean = false): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // <-- Ajouté pour les cookies de session
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          is_ldap: isLdap
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Si c'est un cas de changement de mot de passe requis, ne pas lancer d'erreur
        if (data.needs_password_change) {
          return data;
        }
        // Retourner les erreurs d'autorisation LDAP sans lancer d'exception
        if (data.error && data.error.includes('Non autorisé')) {
          return {
            success: false,
            error: data.error,
            message: data.message,
            user: undefined
          };
        }
        
        // Gestion spécifique pour les comptes inexistants
        if (data.error && (data.error.includes('Erreur d\'authentification') || data.message && data.message.includes('n\'existe pas'))) {
          return {
            success: false,
            error: data.error,
            message: data.message,
            user: undefined
          };
        }
        throw new Error(data.message || data.error || 'Erreur lors de la connexion');
      }

       return {
    success: response.ok,
    user: data.user,
    message: data.message,
    error: data.error,
    needs_password_change: data.needs_password_change,
    user_email: data.user_email
  };
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      localStorage.removeItem('quantum_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    const user = getWithExpiry('quantum_user');
    return !!user;
  },

  // Obtenir le token d'accès
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },
  
  // Obtenir l'utilisateur connecté (avec vérification d'expiration)
  getCurrentUser(): User | null {
    return getWithExpiry('quantum_user');
  },

  // Sauvegarder les tokens
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  // Sauvegarder les informations utilisateur avec expiration
  saveUser(user: User): void {
    setWithExpiry('quantum_user', user, 24); // Expire après 24 heures
  },
}; 