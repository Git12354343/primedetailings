// src/components/dashboard/JobFilters.jsx
import React from 'react';
import { List, CalendarDays, RefreshCw } from 'lucide-react';

const JobFilters = ({ 
  filter, 
  setFilter, 
  viewMode, 
  setViewMode, 
  statusCounts, 
  onRefresh, 
  isLoading 
}) => {
  const filterOptions = [
    { key: 'ALL', label: `All (${statusCounts.TOTAL})` },
    { key: 'CONFIRMED', label: `Confirmed (${statusCounts.CONFIRMED})` },
    { key: 'IN_PROGRESS', label: `Active (${statusCounts.IN_PROGRESS})` },
    { key: 'COMPLETED', label: `Done (${statusCounts.COMPLETED})` }
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Calendar
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default JobFilters;