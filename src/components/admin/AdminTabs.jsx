import React from 'react';
import { Activity, AlertCircle, Settings, PlusCircle, Calendar, Package, Users, Image } from 'lucide-react';

const TABS = [
  { id: 'live-feed',      label: 'Live Feed',   icon: Activity,    countKey: 'allBookings' },
  { id: 'unassigned',     label: 'Unassigned',  icon: AlertCircle, countKey: 'unassigned', alert: true },
  { id: 'detailers',      label: 'Detailers',   icon: Users,       countKey: null },
  { id: 'packages',       label: 'Packages',    icon: Package,     countKey: 'packages' },
  { id: 'services',       label: 'Services',    icon: Settings,    countKey: 'services' },
  { id: 'manual-booking', label: 'Add Booking', icon: PlusCircle,  countKey: null },
  { id: 'gallery',        label: 'Gallery',     icon: Image,       countKey: null },
  { id: 'schedule',       label: 'Schedule',    icon: Calendar,    countKey: null },
];

const AdminTabs = ({ activeTab, setActiveTab, counts }) => (
  <div className="rounded-2xl overflow-hidden mb-6"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {TABS.map(({ id, label, icon: Icon, countKey, alert }) => {
        const isActive = activeTab === id;
        const count    = countKey ? counts?.[countKey] : null;
        const hasAlert = alert && count > 0;
        return (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 relative flex-shrink-0"
            style={{
              borderColor: isActive ? '#f5d376' : 'transparent',
              color:       isActive ? '#f5d376' : '#6b7280',
              background:  isActive ? 'rgba(201,168,76,0.06)' : 'transparent',
            }}>
            <Icon className="w-4 h-4" />
            {label}
            {count !== null && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: hasAlert ? 'rgba(245,158,11,0.2)' : isActive ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.08)',
                  color:      hasAlert ? '#f59e0b'               : isActive ? '#f5d376'                : '#6b7280',
                }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default AdminTabs;
