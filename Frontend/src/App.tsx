import React, { useEffect }from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import EndUserPage from './pages/EndUserPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage'; 
import ImportPage from './pages/ImportPage';
import ProtectedRoute from './components/ProtectedRoute'; // Importer le composant de protection
import { AuthProvider } from './context/AuthContext'; // Importer le provider
import { ToastProvider } from './components/Toast/ToastContext';

function App() {
    useEffect(() => {
    document.body.className = 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50';
    return () => { document.body.className = ''; };
  }, []);
  return (
    // 1. Envelopper toute l'application dans AuthProvider
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div >
            <Navigation />
            <main>
              <Routes>
                 <Route path="/import" element={<ImportPage />} />
                <Route path="/" element={<EndUserPage />} />
                <Route path="/login" element={<LoginPage />} />
        
                {/* 2. Protéger la route /admin */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      
                      <AdminPage />
        
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;