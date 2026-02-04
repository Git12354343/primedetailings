// src/components/admin/AdminStats.jsx
import React from 'react';
import { AlertCircle, Users, Briefcase, Activity, Settings } from 'lucide-react';

const AdminStats = ({ 
  unassignedCount, 
  detailersCount, 
  totalJobs, 
  activeJobs, 
  servicesCount 
}) => {
  const stats = [
    {
      label: 'Unassigned',
      value: unassignedCount,
      icon: AlertCircle,
      color: 'yellow'
    },
    {
      label: 'Active Detailers',
      value: detailersCount,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Total Jobs',
      value: totalJobs,
      icon: Briefcase,
      color: 'green'
    },
    {
      label: 'Active Jobs',
      value: activeJobs,
      icon: Activity,
      color: 'orange'
    },
    {
      label: 'Active Services',
      value: servicesCount,
      icon: Settings,
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStats;