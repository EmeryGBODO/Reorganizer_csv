import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import EndUserPage from './pages/EndUserPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage'; // Importer la nouvelle page
import ProtectedRoute from './components/ProtectedRoute'; // Importer le composant de protection
import { AuthProvider } from './context/AuthContext'; // Importer le provider

function App() {
  return (
    // 1. Envelopper toute l'application dans AuthProvider
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main>
            <Routes>
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
    </AuthProvider>
  );
}

export default App;