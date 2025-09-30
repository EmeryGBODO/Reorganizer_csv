import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation,useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={()=>navigate("/")}>
              <h1 className="text-xl font-bold text-gray-900">CSV Reorganizer</h1>
            </div>
          </div>

          <div className="flex items-center">

            
              <div>
                {location.pathname == "/" && (<NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Settings className="h-4 w-4" />
                </NavLink>)}
                            
                          </div>
                
                          {isAuthenticated && (
                             <div className="flex items-center">
                  <button
                      onClick={logout}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                      <LogOut className="h-4 w-4 mr-2" />
                  </button>
                             </div>
                          )}
              </div>

        </div>
      </div>
    </nav>
  );
};

export default Navigation;