// src/components/admin/AdminSidebar.jsx
// Professional left-rail navigation that replaces the horizontal AdminTabs.
// Same activeTab/setActiveTab contract, so it's a drop-in.
// Collapses to a horizontal scroll strip on mobile automatically.
import React from 'react';
import { Activity, AlertCircle, Settings, PlusCircle, Calendar, Package, Layers, Star, MessageSquare, Camera, TrendingUp, Users, LogOut, RefreshCw, FileText } from 'lucide-react';

const NAV = [
  { id: 'live-feed',      label: 'Live Feed',   icon: Activity,    countKey: 'allBookings' },
  { id: 'quotes',         label: 'Quotes',      icon: FileText,    countKey: 'newQuotes',   alert: true },
  { id: 'catalog',        label: 'Catalog',     icon: Layers,      countKey: null },
  { id: 'reviews',        label: 'Reviews',     icon: Star,        countKey: null },
  { id: 'manual-booking', label: 'Add Booking', icon: PlusCircle,  countKey: null },
  { id: 'schedule',       label: 'Schedule',    icon: Calendar,    countKey: null },
  { id: 'revenue',        label: 'Revenue',     icon: TrendingUp,  countKey: null },
  { id: 'detailers',      label: 'Detailers',   icon: Users,       countKey: null },
  { id: 'contacts',       label: 'Messages',    icon: MessageSquare, countKey: 'contacts' },
  { id: 'gallery',        label: 'Gallery',     icon: Camera,        countKey: null },
];

const AdminSidebar = ({ activeTab, setActiveTab, counts, onLogout, onRefresh, refreshing }) => {
  const Item = ({ id, label, icon: Icon, countKey, alert }) => {
    const active = activeTab === id;
    const count = countKey ? counts?.[countKey] : null;
    const hasAlert = alert && count > 0;
    return (
      <button onClick={() => setActiveTab(id)}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 w-full"
        style={{
          background: active ? 'rgba(0,168,204,0.1)' : 'transparent',
          border: active ? '1px solid rgba(0,168,204,0.25)' : '1px solid transparent',
          color: active ? '#00d4ff' : '#a1a1aa',
        }}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{label}</span>
        {count != null && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: hasAlert ? 'rgba(245,158,11,0.2)' : active ? 'rgba(0,168,204,0.15)' : 'rgba(255,255,255,0.07)',
              color: hasAlert ? '#f59e0b' : active ? '#00d4ff' : '#71717a',
            }}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 self-start sticky top-6 rounded-2xl p-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            <span className="text-black font-black text-xs">PP</span>
          </div>
          <div><div className="text-white font-bold text-sm leading-none">Prestige Plus</div><div className="text-gray-500 text-[10px] mt-0.5">Admin</div></div>
        </div>
        <nav className="space-y-1">{NAV.map((n) => <Item key={n.id} {...n} />)}</nav>
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onRefresh} disabled={refreshing} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors w-full">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={onLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile horizontal strip */}
      <div className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 w-max">{NAV.map((n) => <div key={n.id} className="w-auto"><Item {...n} /></div>)}</div>
      </div>
    </>
  );
};

export default AdminSidebar;
