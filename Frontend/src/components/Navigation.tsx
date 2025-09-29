import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Settings } from 'lucide-react';

const Navigation: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">CSV Reorganizer</h1>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <FileText className="h-4 w-4 mr-2" />
              Utilisateur Final
            </NavLink>

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <Settings className="h-4 w-4 mr-2" />
              Administration
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;