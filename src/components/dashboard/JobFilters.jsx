// src/components/dashboard/JobFilters.jsx
import React from 'react';
import { List, CalendarDays, RefreshCw } from 'lucide-react';

const GOLD_S = '#c9a84c';

const JobFilters = ({ filter, setFilter, viewMode, setViewMode, statusCounts, onRefresh, isLoading }) => {
  const filters = [
    { key: 'ALL',         label: 'All',       count: statusCounts.TOTAL       },
    { key: 'CONFIRMED',   label: 'Confirmed', count: statusCounts.CONFIRMED   },
    { key: 'IN_PROGRESS', label: 'Active',    count: statusCounts.IN_PROGRESS },
    { key: 'COMPLETED',   label: 'Done',      count: statusCounts.COMPLETED   },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map(({ key, label, count }) => {
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={active
                ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)', color: '#f5d376' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {label}
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{ background: active ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex rounded-xl p-0.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { mode: 'list',     icon: List,        label: 'List' },
            { mode: 'calendar', icon: CalendarDays, label: 'Cal' },
          ].map(({ mode, icon: Icon, label }) => {
            const active = viewMode === mode;
            return (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active
                  ? { background: 'rgba(201,168,76,0.15)', color: '#f5d376' }
                  : { color: 'rgba(255,255,255,0.4)' }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <button onClick={onRefresh} disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default JobFilters;
