import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginCredentials, User } from '../services/authService';

// Interface User est maintenant importée depuis authService

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, isLdap?: boolean) => Promise<{ success: boolean, error?: string, message?: string, needs_password_change?: boolean, user_email?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  setLoadingState: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
        } else {
          // Si getCurrentUser retourne null mais isAuthenticated est true, nettoyer
          await authService.logout();
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string, isLdap: boolean = false): Promise<{ success: boolean, error?: string, message?: string, needs_password_change?: boolean, user_email?: string }> => {
    setIsLoading(true);
    try {
      const credentials: LoginCredentials = { username, password };
      const response = await authService.login(credentials, isLdap);

      if (response.success && !response.needs_password_change) {
        setUser(response.user!);
        authService.saveUser(response.user!);
        setIsLoading(false);
        return { success: true };
      } else {
        // Toujours arrêter le loading pour permettre l'affichage du formulaire
        setIsLoading(false);
        return { 
          success: false, 
          error: response.error, 
          message: response.message,
          needs_password_change: response.needs_password_change,
          user_email: response.user_email
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'authentification:', error);
      setIsLoading(false);
      return { success: false, error: error?.message || 'Erreur inconnue' };
    }

    
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const setLoadingState = (loading: boolean) => {
    setIsLoading(loading);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    setLoadingState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
  
}; 