import React from 'react';
import { AlertCircle, Users, Briefcase, Activity, Settings } from 'lucide-react';

const STATS_CONFIG = [
  { key: 'unassigned',    label: 'Unassigned',      icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'detailers',    label: 'Active Detailers', icon: Users,       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { key: 'total',        label: 'Total Jobs',       icon: Briefcase,   color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  { key: 'active',       label: 'Active Jobs',      icon: Activity,    color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'services',     label: 'Services',         icon: Settings,    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
];

const AdminStats = ({ unassignedCount, detailersCount, totalJobs, activeJobs, servicesCount }) => {
  const values = {
    unassigned: unassignedCount,
    detailers:  detailersCount,
    total:      totalJobs,
    active:     activeJobs,
    services:   servicesCount,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {STATS_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div
              className="text-2xl font-black leading-none"
              style={{ color }}
            >
              {values[key] ?? 0}
            </div>
            <div className="text-gray-500 text-xs mt-1 font-medium">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
