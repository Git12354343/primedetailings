import React from 'react';
import { RefreshCw, LogOut, Bell } from 'lucide-react';

const AdminHeader = ({ onLogout, onRefresh, refreshing }) => (
  <header
    className="sticky top-0 z-50"
    style={{
      background: 'rgba(8,8,8,0.97)',
      borderBottom: '1px solid rgba(201,168,76,0.15)',
      backdropFilter: 'blur(20px)',
    }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}>
            <span className="text-black font-black text-xs">PD</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Prime Detailing</div>
            <div className="text-gray-500 text-xs mt-0.5">Admin Dashboard</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#f5d376',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default AdminHeader;
