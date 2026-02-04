// src/components/admin/AdminTabs.jsx
import React from 'react';
import { Activity, AlertCircle, Settings } from 'lucide-react';

const AdminTabs = ({ activeTab, setActiveTab, counts }) => {
  const tabs = [
    {
      id: 'live-feed',
      label: 'Live Job Feed',
      icon: Activity,
      count: counts.allBookings
    },
    {
      id: 'unassigned',
      label: 'Unassigned',
      icon: AlertCircle,
      count: counts.unassigned
    },
    {
      id: 'services',
      label: 'Services',
      icon: Settings,
      count: counts.services
    }
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminTabs;