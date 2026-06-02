import React from 'react';
import { LogOut, Home, DollarSign, Zap } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff, #00a8cc)';
const GOLD_S = '#00a8cc';

const DashboardHeader = ({ detailer, todaysEarnings, onLogout, onNavigateHome }) => {
  const initials = detailer?.name
    ? detailer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <header className="sticky top-0 z-40"
      style={{ background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(0,168,204,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: GOLD }}>
              <Zap className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-none">Prestige Plus Services</p>
              <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Staff Dashboard</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Earnings pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
              <DollarSign className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
              <span className="text-xs font-bold" style={{ color: GOLD_S }}>
                Today: ${(todaysEarnings || 0).toFixed(2)}
              </span>
            </div>

            {/* Website link */}
            <button onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Website</span>
            </button>

            {/* Detailer avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(0,168,204,0.15)', color: GOLD_S, border: '1px solid rgba(0,168,204,0.25)' }}>
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-white">{detailer?.name}</span>
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
