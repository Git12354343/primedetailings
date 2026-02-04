// src/components/dashboard/StatsCards.jsx
import React from 'react';
import { Briefcase, AlertCircle, Clock, CheckCircle, DollarSign } from 'lucide-react';

const StatsCards = ({ statusCounts, todaysEarnings }) => {
  const stats = [
    {
      label: 'Total Jobs',
      value: statusCounts.TOTAL,
      icon: Briefcase,
      color: 'blue'
    },
    {
      label: 'Pending',
      value: statusCounts.CONFIRMED,
      icon: AlertCircle,
      color: 'yellow'
    },
    {
      label: 'Active',
      value: statusCounts.IN_PROGRESS,
      icon: Clock,
      color: 'orange'
    },
    {
      label: 'Done',
      value: statusCounts.COMPLETED,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Today',
      value: `$${todaysEarnings.toFixed(0)}`,
      icon: DollarSign,
      color: 'green'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      orange: 'bg-orange-100 text-orange-600',
      green: 'bg-green-100 text-green-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-full ${getColorClasses(stat.color)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;