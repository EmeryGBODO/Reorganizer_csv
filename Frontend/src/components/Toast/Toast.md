# Toast Component

Système de notifications Toast réutilisable pour React TypeScript avec Tailwind CSS.

## Installation

Les composants sont déjà intégrés dans le projet. Le `ToastProvider` est configuré dans `App.tsx`.

## Utilisation

```tsx
import { useToast } from './components/reusable_components';

const MyComponent = () => {
  const { addToast } = useToast();

  const handleSuccess = () => {
    addToast({
      type: 'success',
      message: 'Opération réussie !',
      duration: 3000 // optionnel
    });
  };

  return <button onClick={handleSuccess}>Succès</button>;
};
```

## Types de Toast

- `success` - Toast vert avec icône ✓
- `error` - Toast rouge avec icône ✕  
- `warning` - Toast jaune avec icône ⚠
- `info` - Toast bleu avec icône ℹ

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | - | Type du toast |
| `message` | `string` | - | Message à afficher |
| `duration` | `number` | `5000` | Durée en ms avant fermeture auto |

## Fonctionnalités

- ✅ Auto-fermeture configurable
- ✅ Fermeture manuelle avec bouton ×
- ✅ Animation d'entrée fluide
- ✅ Positionnement fixe (top-right)
- ✅ Gestion de plusieurs toasts simultanés
- ✅ TypeScript support complet

## Exemple complet

```tsx
const { addToast } = useToast();

// Toast de succès
addToast({ type: 'success', message: 'Sauvegarde réussie' });

// Toast d'erreur avec durée personnalisée
addToast({ 
  type: 'error', 
  message: 'Erreur de connexion', 
  duration: 8000 
});
```






<!-- export { default as Toast } from './Toast/Toast'; -->
<!-- export { ToastProvider, useToast } from './Toast/ToastContext'; -->
<!-- export type { ToastProps } from './Toast/Toast'; -->