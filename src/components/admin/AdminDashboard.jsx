import React, { useState } from 'react';
import { useNotifications }    from '../../hooks/useNotifications';
import { useAdminData }        from '../../hooks/useAdminData';
import { Loader2 }             from 'lucide-react';

import AdminHeader            from './AdminHeader';
import AdminStats             from './AdminStats';
import AdminTabs              from './AdminTabs';
import LiveJobFeed            from './LiveJobFeed';
import UnassignedBookings     from './UnassignedBookings';
import ServiceManagement      from './ServiceManagement';
import ManualBookingForm      from './ManualBookingForm';
import GalleryManagement      from './GalleryManagement';
import ScheduleManager        from './ScheduleManager';
import ActiveDetailersSidebar from './ActiveDetailersSidebar';
import DetailerManagement     from './DetailerManagement';
import PackageManagement      from './PackageManagement';

const AdminDashboard = ({ adminToken, onLogout }) => {
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
    try {
      await refreshData();
      success('Data refreshed');
    } catch {
      notifyErr('Could not refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}>
            <span className="text-black font-black text-sm">PD</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <AdminHeader onLogout={onLogout} onRefresh={handleRefresh} refreshing={refreshing} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {error && (
          <div className="mb-4 p-4 rounded-xl text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <AdminStats
          unassignedCount={unassignedBookings.length}
          detailersCount={activeDetailers.length}
          totalJobs={allBookings.length}
          activeJobs={statusCounts.IN_PROGRESS + statusCounts.EN_ROUTE + statusCounts.STARTED}
          servicesCount={services.filter(s => s.isActive).length}
        />

        <AdminTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            allBookings: allBookings.length,
            unassigned:  unassignedBookings.length,
            services:    services.length,
          }}
        />

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">

            {activeTab === 'live-feed' && (
              <LiveJobFeed
                bookings={allBookings}
                statusCounts={statusCounts}
                onRefresh={handleRefresh}
                onJobClick={(job) => console.log('Job clicked:', job)}
              />
            )}

            {activeTab === 'unassigned' && (
              <UnassignedBookings
                bookings={unassignedBookings}
                detailers={activeDetailers}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'services' && (
              <ServiceManagement
                services={services}
                addOns={addOns}
                onRefresh={handleRefresh}
                adminToken={adminToken}
              />
            )}

            {activeTab === 'manual-booking' && (
              <ManualBookingForm
                detailers={activeDetailers}
                services={services}
                onSuccess={handleRefresh}
              />
            )}

            {activeTab === 'schedule' && <ScheduleManager />}

            {activeTab === 'packages' && (
              <PackageManagement
                packages={packages}
                services={services}
                addOns={addOns}
                onRefresh={handleRefresh}
                authFetch={authFetch}
              />
            )}

            {activeTab === 'gallery' && <GalleryManagement adminToken={adminToken} />}

            {activeTab === 'detailers' && (
              <DetailerManagement
                adminToken={adminToken}
                authFetch={authFetch}
                onRefreshGlobal={handleRefresh}
              />
            )}

          </div>

          {(activeTab === 'live-feed' || activeTab === 'unassigned') && (
            <div className="hidden xl:block w-72 flex-shrink-0">
              <ActiveDetailersSidebar detailers={activeDetailers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
