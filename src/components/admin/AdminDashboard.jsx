// src/components/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAdminData } from '../../hooks/useAdminData';
import { Loader2, RefreshCw, LogOut } from 'lucide-react';

import AdminSidebar           from './AdminSidebar';
import AdminStatsPro          from './AdminStatsPro';
import ActiveDetailersSidebar from './ActiveDetailersSidebar';
import LiveJobFeed            from './LiveJobFeed';
import UnassignedBookings     from './UnassignedBookings';
import ServiceManagement      from './ServiceManagement';
import AdminQuoteManager      from './AdminQuoteManager';
import ReviewManagement       from './ReviewManagement';
import ManualBookingForm      from './ManualBookingForm';
import ScheduleManager        from './ScheduleManager';
import RevenueAnalytics       from './RevenueAnalytics';
import DetailerManagement     from './DetailerManagement';
import GalleryManagement      from './GalleryManagement';
import AdminBulkReschedule    from './AdminBulkReschedule';
import AdminAuditLog          from './AdminAuditLog';
import AdminExport            from './AdminExport';
import WeatherBanner          from './AdminWeatherAlerts';
import CustomerManagement     from './CustomerManagement';

// ContactManagement — inline since it may not exist as a separate file
const ContactManagement = ({ adminToken }) => {
  const [contacts, setContacts] = React.useState([]);
  const [loading, setLoading]   = React.useState(true);
  const API = import.meta.env.VITE_API_URL;

  React.useEffect(() => {
    fetch(`${API}/admin/contacts`, {
      headers: { 'X-Admin-Secret': adminToken || '' }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setContacts(d.contacts || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminToken || '' },
      body: JSON.stringify({ status }),
    });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const GOLD_S = '#00a8cc';
  const STATUS_COLORS = {
    NEW:         { bg: 'rgba(0,168,204,0.12)',  color: '#00d4ff'  },
    IN_PROGRESS: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa'  },
    RESOLVED:    { bg: 'rgba(52,211,153,0.12)',  color: '#34d399'  },
    ARCHIVED:    { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' },
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
    </div>
  );

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-xl font-black text-white mb-4">Contact Messages</h2>
      {contacts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No contact messages yet.</div>
      ) : contacts.map(c => (
        <div key={c.id} className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-sm">{c.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={STATUS_COLORS[c.status] || STATUS_COLORS.NEW}>
                  {c.status}
                </span>
              </div>
              <p className="text-xs mb-1" style={{ color: GOLD_S }}>{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
              {c.subject && <p className="text-xs font-semibold text-white mb-1">{c.subject}</p>}
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{c.message}</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {['NEW','IN_PROGRESS','RESOLVED','ARCHIVED'].filter(s => s !== c.status).map(s => (
                <button key={s} onClick={() => updateStatus(c.id, s)}
                  className="text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {s.replace('_', ' ')}
                </button>
              ))}
              <a href={`mailto:${c.email}`}
                className="text-xs px-2 py-1 rounded-lg text-center transition-colors"
                style={{ background: 'rgba(0,168,204,0.1)', color: '#00d4ff', border: '1px solid rgba(0,168,204,0.2)' }}>
                Reply
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Tab metadata ──────────────────────────────────────────────────────────────
const TITLES = {
  'live-feed':      { t: 'Live Feed',     s: 'Real-time job activity' },
  'unassigned':     { t: 'Unassigned',    s: 'Bookings waiting for a detailer' },
  'quotes':         { t: 'Quotes',        s: 'Retail custom quote requests' },
  'catalog':        { t: 'Catalog',       s: 'Packages, services, pricing and add-ons' },
  'reviews':        { t: 'Reviews',       s: 'Curate the reviews shown on your site' },
  'manual-booking': { t: 'Add Booking',   s: 'Create a booking on behalf of a customer' },
  'schedule':       { t: 'Schedule',      s: 'Availability and working hours' },
  'revenue':        { t: 'Revenue',       s: 'Earnings and analytics' },
  'customers':      { t: 'Customers',     s: 'Profiles, history and lifetime value' },
  'detailers':      { t: 'Detailers',     s: 'Manage your team' },
  'messages':       { t: 'Messages',      s: 'Customer contact form submissions' },
  'gallery':        { t: 'Gallery',       s: 'Before & after job photos' },
  'bulk':           { t: 'Bulk Ops',      s: 'Reschedule multiple bookings at once' },
  'export':         { t: 'Export',        s: 'Download booking and revenue data' },
  'audit':          { t: 'Audit Log',     s: 'Track admin actions and changes' },
};

const SHOW_DETAILER_RAIL = ['live-feed', 'unassigned'];

// ── Main component ─────────────────────────────────────────────────────────────
const AdminDashboard = ({ onLogout, adminToken }) => {
  const [activeTab,  setActiveTab]  = useState('live-feed');
  const [refreshing, setRefreshing] = useState(false);

  const {
    unassignedBookings, allBookings, activeDetailers,
    services, addOns, packages, isLoading, error, refreshData, authFetch,
  } = useAdminData(adminToken);

  const { success, error: notifyErr } = useNotifications();

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try { await refreshData(); success('Data refreshed'); }
    catch { notifyErr('Refresh failed'); }
    finally { setRefreshing(false); }
  };

  const statusCounts = {
    ALL:         allBookings.length,
    PENDING:     allBookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED:   allBookings.filter(b => b.status === 'CONFIRMED').length,
    EN_ROUTE:    allBookings.filter(b => b.status === 'EN_ROUTE').length,
    STARTED:     allBookings.filter(b => b.status === 'STARTED').length,
    IN_PROGRESS: allBookings.filter(b => b.status === 'IN_PROGRESS').length,
    COMPLETED:   allBookings.filter(b => b.status === 'COMPLETED').length,
  };

  const showDetailerRail = SHOW_DETAILER_RAIL.includes(activeTab);
  const title = TITLES[activeTab] || { t: activeTab, s: '' };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f1a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
          <span className="text-black font-black text-sm">PP</span>
        </div>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#00a8cc' }} />
        <p className="text-sm text-gray-500">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden" style={{ background: '#0b0f1a' }}>

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        counts={{
          allBookings:  allBookings.length,
          unassigned:   unassignedBookings.length,
          services:     services.length,
          packages:     packages?.length,
        }}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
          <div>
            <h1 className="text-white font-black text-lg">{title.t}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{title.s}</p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <p className="text-xs text-red-400 max-w-xs truncate">{error}</p>
            )}
            <div className="flex items-center gap-1 lg:hidden">
              <button onClick={handleRefresh} disabled={refreshing} aria-label="Refresh"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onLogout} aria-label="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-6 pt-4 flex-shrink-0">
          <AdminStatsPro
            unassignedCount={unassignedBookings.length}
            detailersCount={activeDetailers.length}
            totalJobs={allBookings.length}
            activeJobs={statusCounts.IN_PROGRESS + statusCounts.EN_ROUTE + statusCounts.STARTED}
            servicesCount={services.filter(s => s.isActive).length}
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-6 items-start p-6">
            <div className="flex-1 min-w-0">
              {activeTab === 'live-feed'      && <WeatherBanner adminToken={adminToken} />}
              {activeTab === 'live-feed'      && <LiveJobFeed bookings={allBookings} unassignedBookings={unassignedBookings} detailers={activeDetailers} statusCounts={statusCounts} onRefresh={handleRefresh} onJobClick={() => {}} />}
              {activeTab === 'unassigned'     && <UnassignedBookings bookings={unassignedBookings} detailers={activeDetailers} onRefresh={handleRefresh} />}
              {activeTab === 'quotes'         && <AdminQuoteManager adminToken={adminToken} />}
              {activeTab === 'catalog'        && <ServiceManagement services={services} addOns={addOns} packages={packages} onRefresh={handleRefresh} adminToken={adminToken} />}
              {activeTab === 'reviews'        && <ReviewManagement adminToken={adminToken} />}
              {activeTab === 'manual-booking' && <ManualBookingForm adminToken={adminToken} detailers={activeDetailers} services={services} onSuccess={handleRefresh} />}
              {activeTab === 'schedule'       && <ScheduleManager adminToken={adminToken} />}
              {activeTab === 'revenue'        && <RevenueAnalytics adminToken={adminToken} />}
              {activeTab === 'customers'      && <CustomerManagement adminToken={adminToken} />}
              {activeTab === 'detailers'      && <DetailerManagement adminToken={adminToken} authFetch={authFetch} onRefreshGlobal={handleRefresh} />}
              {activeTab === 'messages'       && <ContactManagement adminToken={adminToken} />}
              {activeTab === 'gallery'        && <GalleryManagement adminToken={adminToken} />}
              {activeTab === 'bulk'           && <AdminBulkReschedule adminToken={adminToken} />}
              {activeTab === 'export'         && <AdminExport adminToken={adminToken} />}
              {activeTab === 'audit'          && <AdminAuditLog adminToken={adminToken} />}
            </div>

            {showDetailerRail && (
              <div className="hidden xl:block w-72 flex-shrink-0">
                <ActiveDetailersSidebar detailers={activeDetailers} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
