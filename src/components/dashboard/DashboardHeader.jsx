// src/components/dashboard/DashboardHeader.jsx
import React from 'react';
import { LogOut, User, Home, DollarSign } from 'lucide-react';

const DashboardHeader = ({ detailer, todaysEarnings, onLogout, onNavigateHome }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prime Detailing</h1>
            <p className="text-sm text-gray-600">Professional Dashboard</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Today's Earnings */}
            <div className="hidden sm:flex items-center bg-green-50 px-3 py-2 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-green-900">
                Today: ${todaysEarnings.toFixed(2)}
              </span>
            </div>

            <button
              onClick={onNavigateHome}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="text-sm hidden sm:inline">Website</span>
            </button>
            
            <div className="flex items-center text-gray-700">
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{detailer?.name}</span>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="text-sm hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;