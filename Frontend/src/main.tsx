import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Le <StrictMode> a été retiré d'ici pour assurer la compatibilité
createRoot(document.getElementById('root')!).render(
    <App />
);