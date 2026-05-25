// src/components/admin/AdminDashboard.jsx  (REDESIGNED)
// Drop-in replacement. Keeps useAdminData + all existing child components.
// Changes vs original:
//  - Left sidebar (AdminSidebar) instead of horizontal AdminTabs
//  - Polished stat cards (AdminStatsPro)
//  - NEW "reviews" tab -> ReviewManagement
//  - Wires the previously-dead "packages" tab -> PackageManagement
//  - Per-view page title header
import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAdminData } from '../../hooks/useAdminData';
import { Loader2 } from 'lucide-react';

import AdminSidebar       from './AdminSidebar';
import AdminStatsPro      from './AdminStatsPro';
import LiveJobFeed        from './LiveJobFeed';
import UnassignedBookings from './UnassignedBookings';
import ServiceManagement  from './ServiceManagement';
import ManualBookingForm  from './ManualBookingForm';
import ScheduleManager    from './ScheduleManager';
import ActiveDetailersSidebar from './ActiveDetailersSidebar';
import ReviewManagement   from './ReviewManagement';
import PackageManagement  from './PackageManagement';
import ContactManagement  from './ContactManagement';
import GalleryManagement    from './GalleryManagement';
import RevenueAnalytics    from './RevenueAnalytics';
import DetailerManagement  from './DetailerManagement';

const TITLES = {
  'live-feed':      { t: 'Live Feed',    s: 'Real-time job activity' },
  'unassigned':     { t: 'Unassigned',   s: 'Bookings waiting for a detailer' },
  'packages':       { t: 'Packages',     s: 'Bundle services into sellable packages' },
  'services':       { t: 'Services',     s: 'Manage services, pricing and add-ons' },
  'reviews':        { t: 'Reviews',      s: 'Curate the reviews shown on your site' },
  'manual-booking': { t: 'Add Booking',  s: 'Create a booking on behalf of a customer' },
  'schedule':       { t: 'Schedule',     s: 'Availability and working hours' },
  'contacts':       { t: 'Messages',      s: 'Contact form submissions' },
  'gallery':        { t: 'Gallery',       s: 'Before & after job photos' },
  'revenue':        { t: 'Revenue',       s: 'Earnings and booking analytics' },
  'detailers':      { t: 'Detailers',     s: 'Manage detailer accounts' },
};

const AdminDashboard = ({ adminToken, onLogout }) => {
  const [activeTab, setActiveTab] = useState('live-feed');
  const [refreshing, setRefreshing] = useState(false);

  const { unassignedBookings, allBookings, activeDetailers, services, addOns, isLoading, error, refreshData, authFetch } = useAdminData(adminToken);
  const { success, error: notifyErr } = useNotifications();

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try { await refreshData(); success('Data refreshed'); }
    catch { notifyErr('Could not refresh. Please try again.'); }
    finally { setRefreshing(false); }
  };

  const statusCounts = {
    ALL: allBookings.length,
    PENDING: allBookings.filter((b) => b.status === 'PENDING').length,
    CONFIRMED: allBookings.filter((b) => b.status === 'CONFIRMED').length,
    EN_ROUTE: allBookings.filter((b) => b.status === 'EN_ROUTE').length,
    STARTED: allBookings.filter((b) => b.status === 'STARTED').length,
    IN_PROGRESS: allBookings.filter((b) => b.status === 'IN_PROGRESS').length,
    COMPLETED: allBookings.filter((b) => b.status === 'COMPLETED').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)' }}>
            <span className="text-black font-black text-sm">PD</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          <p className="text-gray-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const showDetailerRail = activeTab === 'live-feed' || activeTab === 'unassigned';
  const title = TITLES[activeTab] || { t: '', s: '' };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">

          <AdminSidebar
            activeTab={activeTab} setActiveTab={setActiveTab}
            counts={{ allBookings: allBookings.length, unassigned: unassignedBookings.length, services: services.length, packages: undefined, contacts: undefined }}
            onLogout={onLogout} onRefresh={handleRefresh} refreshing={refreshing}
          />

          <div className="flex-1 min-w-0">
            {/* Page header */}
            <div className="mb-5">
              <h1 className="text-xl font-black text-white">{title.t}</h1>
              <p className="text-gray-500 text-sm">{title.s}</p>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>
            )}

            <AdminStatsPro
              unassignedCount={unassignedBookings.length}
              detailersCount={activeDetailers.length}
              totalJobs={allBookings.length}
              activeJobs={statusCounts.IN_PROGRESS + statusCounts.EN_ROUTE + statusCounts.STARTED}
              servicesCount={services.filter((s) => s.isActive).length}
            />

            <div className="flex gap-6 items-start">
              <div className="flex-1 min-w-0">
                {activeTab === 'live-feed'      && <LiveJobFeed bookings={allBookings} statusCounts={statusCounts} onRefresh={handleRefresh} onJobClick={() => {}} availableServices={services} availableAddOns={addOns} />}
                {activeTab === 'unassigned'     && <UnassignedBookings bookings={unassignedBookings} detailers={activeDetailers} onRefresh={handleRefresh} availableServices={services} availableAddOns={addOns} />}
                {activeTab === 'packages'       && <PackageManagement services={services} addOns={addOns} onRefresh={handleRefresh} />}
                {activeTab === 'services'       && <ServiceManagement services={services} addOns={addOns} onRefresh={handleRefresh} />}
                {activeTab === 'reviews'        && <ReviewManagement />}
                {activeTab === 'manual-booking' && <ManualBookingForm detailers={activeDetailers} services={services} onSuccess={handleRefresh} />}
                {activeTab === 'schedule'       && <ScheduleManager />}
                {activeTab === 'contacts'       && <ContactManagement />}
                {activeTab === 'gallery'        && <GalleryManagement adminToken={adminToken} />}
                {activeTab === 'revenue'        && <RevenueAnalytics />}
                {activeTab === 'detailers'      && <DetailerManagement adminToken={adminToken} authFetch={authFetch} onRefreshGlobal={handleRefresh} />}
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
    </div>
  );
};

export default AdminDashboard;
