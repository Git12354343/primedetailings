// src/components/admin/AdminSidebar.jsx
// Professional left-rail navigation that replaces the horizontal AdminTabs.
// Same activeTab/setActiveTab contract, so it's a drop-in.
// Collapses to a horizontal scroll strip on mobile automatically.
import React from 'react';
import { Activity, AlertCircle, PlusCircle, Calendar, CalendarRange, Layers, Star, MessageSquare, Camera, TrendingUp, Users, UserCog, LogOut, RefreshCw, FileText, Download, BookOpen } from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { id: 'live-feed',      label: 'Live Feed',   icon: Activity,      countKey: 'allBookings' },
      { id: 'unassigned',     label: 'Unassigned',  icon: AlertCircle,   countKey: 'unassigned', alert: true },
      { id: 'quotes',         label: 'Quotes',      icon: FileText,      countKey: 'newQuotes',  alert: true },
      { id: 'manual-booking', label: 'Add Booking', icon: PlusCircle,    countKey: null },
      { id: 'schedule',       label: 'Schedule',    icon: Calendar,      countKey: null },
      { id: 'bulk',           label: 'Bulk Ops',    icon: CalendarRange, countKey: null },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'customers',      label: 'Customers',   icon: Users,         countKey: null },
      { id: 'catalog',        label: 'Catalog',     icon: Layers,        countKey: null },
      { id: 'revenue',        label: 'Revenue',     icon: TrendingUp,    countKey: null },
      { id: 'detailers',      label: 'Detailers',   icon: UserCog,       countKey: null },
      { id: 'gallery',        label: 'Gallery',     icon: Camera,        countKey: null },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { id: 'messages',       label: 'Messages',    icon: MessageSquare, countKey: null },
      { id: 'reviews',        label: 'Reviews',     icon: Star,          countKey: null },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'export',         label: 'Export',      icon: Download,      countKey: null },
      { id: 'audit',          label: 'Audit Log',   icon: BookOpen,      countKey: null },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

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
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 m-4 mr-0 rounded-2xl p-3 overflow-y-auto custom-scrollbar"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            <span className="text-black font-black text-xs">PP</span>
          </div>
          <div><div className="text-white font-bold text-sm leading-none">Prestige Plus</div><div className="text-gray-500 text-[10px] mt-0.5">Admin</div></div>
        </div>
        <nav className="flex-1">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-3">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((n) => <Item key={n.id} {...n} />)}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-1 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onRefresh} disabled={refreshing} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors w-full">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={onLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile horizontal strip */}
      <div className="lg:hidden px-4 pt-3 pb-1 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 w-max">{ALL_ITEMS.map((n) => <div key={n.id} className="w-auto"><Item {...n} /></div>)}</div>
      </div>
    </>
  );
};

export default AdminSidebar;
