// Fonction pour sauvegarder des données avec expiration (en heures)
export const setWithExpiry = (key: string, value: any, hoursToLive: number = 24) => {
  const now = new Date();
  const item = {
    ...value,
    expiry: now.getTime() + (hoursToLive * 60 * 60 * 1000), // Convertir les heures en millisecondes
  };
  localStorage.setItem(key, JSON.stringify(item));
};

// Fonction pour récupérer des données avec expiration
export const getWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key);
  
  // Si l'élément n'existe pas, retourner null
  if (!itemStr) {
    return null;
  }
  
  const item = JSON.parse(itemStr);
  const now = new Date();
  
  // Comparer l'heure actuelle avec l'heure d'expiration
  if (now.getTime() > item.expiry) {
    // Si l'élément a expiré, le supprimer et retourner null
    localStorage.removeItem(key);
    return null;
  }
  
  return item;
};

// Fonction pour vérifier si un élément a expiré
export const isExpired = (key: string): boolean => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return true;
  
  const item = JSON.parse(itemStr);
  return new Date().getTime() > item.expiry;
};
