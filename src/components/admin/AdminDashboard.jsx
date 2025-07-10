// src/components/admin/AdminDashboard.jsx - Final refactored version using all components
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAdminData } from '../../hooks/useAdminData';

// Import all the extracted components
import AdminHeader from './AdminHeader';
import AdminStats from './AdminStats';
import AdminTabs from './AdminTabs';
import LiveJobFeed from './LiveJobFeed';
import UnassignedBookings from './UnassignedBookings';
import ServiceManagement from './ServiceManagement';
import ActiveDetailersSidebar from './ActiveDetailersSidebar';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('live-feed');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    unassignedBookings,
    allBookings,
    activeDetailers,
    services,
    addOns,
    isLoading,
    error,
    refreshData
  } = useAdminData();

  const { success, error: errorNotification } = useNotifications();

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    
    try {
      await refreshData();
      success('All data has been updated successfully');
    } catch (error) {
      errorNotification('Some data could not be updated. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const statusCounts = {
    ALL: allBookings.length,
    PENDING: allBookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: allBookings.filter(b => b.status === 'CONFIRMED').length,
    EN_ROUTE: allBookings.filter(b => b.status === 'EN_ROUTE').length,
    STARTED: allBookings.filter(b => b.status === 'STARTED').length,
    IN_PROGRESS: allBookings.filter(b => b.status === 'IN_PROGRESS').length,
    COMPLETED: allBookings.filter(b => b.status === 'COMPLETED').length
  };

  const handleJobClick = (job) => {
    // You can implement job detail modal here
    console.log('Job clicked:', job);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        onLogout={onLogout}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminStats 
          unassignedCount={unassignedBookings.length}
          detailersCount={activeDetailers.length}
          totalJobs={allBookings.length}
          activeJobs={statusCounts.EN_ROUTE + statusCounts.STARTED + statusCounts.IN_PROGRESS}
          servicesCount={services.filter(s => s.isActive).length}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <AdminTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            allBookings: allBookings.length,
            unassigned: unassignedBookings.length,
            services: services.length
          }}
        />

        {/* Tab Content */}
        {activeTab === 'live-feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LiveJobFeed 
                jobs={allBookings}
                onJobClick={handleJobClick}
                onRefresh={refreshData}
              />
            </div>
            <div>
              <ActiveDetailersSidebar detailers={activeDetailers} />
            </div>
          </div>
        )}

        {activeTab === 'unassigned' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <UnassignedBookings 
                bookings={unassignedBookings}
                detailers={activeDetailers}
                onRefresh={refreshData}
              />
            </div>
            <div>
              <ActiveDetailersSidebar detailers={activeDetailers} />
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <ServiceManagement 
            services={services}
            addOns={addOns}
            onRefresh={refreshData}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;