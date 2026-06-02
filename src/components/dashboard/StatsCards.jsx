// src/components/dashboard/StatsCards.jsx
import React from 'react';
import { Briefcase, AlertCircle, Clock, CheckCircle, DollarSign } from 'lucide-react';

const ACCENT = {
  blue:   { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  color: '#60a5fa' },
  yellow: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  color: '#f59e0b' },
  orange: { bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)',  color: '#fb923c' },
  green:  { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  color: '#34d399' },
  gold:   { bg: 'rgba(0,168,204,0.1)',  border: 'rgba(0,168,204,0.25)', color: '#00d4ff' },
};

const StatsCards = ({ statusCounts, todaysEarnings }) => {
  const stats = [
    { label: 'Total Jobs',  value: statusCounts.TOTAL,       icon: Briefcase,   accent: 'blue'   },
    { label: 'Confirmed',   value: statusCounts.CONFIRMED,   icon: AlertCircle, accent: 'yellow' },
    { label: 'Active',      value: statusCounts.IN_PROGRESS, icon: Clock,       accent: 'orange' },
    { label: 'Completed',   value: statusCounts.COMPLETED,   icon: CheckCircle, accent: 'green'  },
    { label: "Today's Rev", value: `$${(todaysEarnings || 0).toFixed(0)}`, icon: DollarSign, accent: 'gold' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {stats.map(({ label, value, icon: Icon, accent }) => {
        const a = ACCENT[accent];
        return (
          <div key={label} className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                <Icon className="w-4 h-4" style={{ color: a.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider truncate"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                <p className="text-xl font-black text-white leading-tight">{value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
