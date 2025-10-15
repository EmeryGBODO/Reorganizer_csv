import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation,useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200" onClick={()=>navigate("/")}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">FLO WOP</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
              <div>
                {location.pathname != "/admin" && (<NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
                    }`
                  }
                >
                  <Settings className="h-4 w-4 hover:text-orange-700 dark:hover:text-purple-500 transition-colors" />
                </NavLink>)}
                            
                          </div>
                
                          {isAuthenticated && (
                             <div className="flex items-center">
                  <button
                      onClick={logout}
                      className="inline-flex items-center px-4 py-2 dark:hover:border text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-900/30 hover:shadow-sm transition-all duration-200"
                  >
                      <LogOut className="h-4 w-4 mr-2 hover:text-red-500  transition-colors" />
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