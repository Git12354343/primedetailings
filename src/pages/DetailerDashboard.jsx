// src/pages/DetailerDashboard.jsx - Refactored to remove duplications
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import the separate components instead of duplicating
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsCards from '../components/dashboard/StatsCards';
import TodaysSchedule from '../components/dashboard/TodaysSchedule';
import ActiveJobBanner from '../components/dashboard/ActiveJobBanner';
import JobFilters from '../components/dashboard/JobFilters';
import ProfessionalJobCard from '../components/dashboard/ProfessionalJobCard';
import CalendarView from '../components/dashboard/CalendarView';
import NotesModal from '../components/dashboard/NotesModal';
import SmartNotificationsSystem from '../components/dashboard/SmartNotificationsSystem';

// Import icons
import { Briefcase } from 'lucide-react';

const DetailerDashboard = () => {
  const [detailer, setDetailer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list');
  const [notesModal, setNotesModal] = useState({ show: false, booking: null });
  const [activeJob, setActiveJob] = useState(null);
  const [timeTracking, setTimeTracking] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('detailerToken');
    const detailerInfo = localStorage.getItem('detailerInfo');
    
    if (!token || !detailerInfo) {
      navigate('/detailer-login');
      return;
    }

    setDetailer(JSON.parse(detailerInfo));
    fetchBookings();
    
    const savedActiveJob = localStorage.getItem('activeJob');
    const savedTimeTracking = localStorage.getItem('timeTracking');
    
    if (savedActiveJob) {
      setActiveJob(JSON.parse(savedActiveJob));
    }
    if (savedTimeTracking) {
      setTimeTracking(JSON.parse(savedTimeTracking));
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('timeTracking', JSON.stringify(timeTracking));
  }, [timeTracking]);

  useEffect(() => {
    if (activeJob) {
      localStorage.setItem('activeJob', JSON.stringify(activeJob));
    } else {
      localStorage.removeItem('activeJob');
    }
  }, [activeJob]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('detailerToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/assigned`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('detailerToken');
    localStorage.removeItem('detailerInfo');
    localStorage.removeItem('activeJob');
    localStorage.removeItem('timeTracking');
    navigate('/detailer-login');
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  // Enhanced status update with timeline support
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('detailerToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { 
                ...booking, 
                status: newStatus, 
                timeline: data.booking.timeline || booking.timeline,
                updatedAt: new Date().toISOString() 
              }
            : booking
        ));

        // Handle time tracking based on status
        if (newStatus === 'IN_PROGRESS') {
          startTimeTracking(bookingId);
        } else if (newStatus === 'COMPLETED') {
          stopTimeTracking(bookingId);
        }
      } else {
        alert('Failed to update status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Network error. Please try again.');
    }
  };

  const startTimeTracking = (bookingId) => {
    const now = new Date().toISOString();
    setTimeTracking(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        startTime: now,
        isActive: true
      }
    }));
    
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setActiveJob(booking);
    }
  };

  const stopTimeTracking = (bookingId) => {
    const now = new Date().toISOString();
    setTimeTracking(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        endTime: now,
        isActive: false
      }
    }));

    if (activeJob?.id === bookingId) {
      setActiveJob(null);
    }
  };

  const calculateWorkTime = (bookingId) => {
    const tracking = timeTracking[bookingId];
    if (!tracking?.startTime) return '0h 0m';
    
    const start = new Date(tracking.startTime);
    const end = tracking.endTime ? new Date(tracking.endTime) : new Date();
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleUpdateNotes = async (bookingId, notes) => {
    try {
      const token = localStorage.getItem('detailerToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/notes`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      
      if (data.success) {
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, notes: notes, updatedAt: new Date().toISOString() }
            : booking
        ));
        setNotesModal({ show: false, booking: null });
        alert('Notes updated successfully!');
      } else {
        alert('Failed to update notes: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleCompleteJob = (jobId) => {
    handleStatusUpdate(jobId, 'COMPLETED');
  };

  const handleStartNavigation = (booking) => {
    // This could trigger status update to EN_ROUTE
    if (booking.status === 'CONFIRMED') {
      handleStatusUpdate(booking.id, 'EN_ROUTE');
    }
  };

  const getFilteredBookings = () => {
    if (filter === 'ALL') return bookings;
    return bookings.filter(booking => {
      // Handle both old and new statuses
      if (filter === 'IN_PROGRESS') {
        return ['IN_PROGRESS', 'STARTED', 'EN_ROUTE'].includes(booking.status);
      }
      return booking.status === filter;
    });
  };

  const getStatusCounts = () => {
    return {
      CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
      IN_PROGRESS: bookings.filter(b => ['IN_PROGRESS', 'STARTED', 'EN_ROUTE'].includes(b.status)).length,
      COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
      TOTAL: bookings.length
    };
  };

  const getTodayBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date).toISOString().split('T')[0];
      return bookingDate === today;
    });
  };

  const getTodaysEarnings = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date).toISOString().split('T')[0];
      return bookingDate === today && booking.status === 'COMPLETED';
    });
    
    return todayBookings.reduce((total, booking) => {
      return total + (booking.totalPrice ? parseFloat(booking.totalPrice) : 0);
    }, 0);
  };

  if (isLoading && !detailer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const todayBookings = getTodayBookings();
  const filteredBookings = getFilteredBookings();
  const todaysEarnings = getTodaysEarnings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Smart Notification System */}
      <SmartNotificationsSystem 
        jobs={bookings}
        onJobAction={handleStatusUpdate}
        userRole="detailer"
      />

      {/* Header */}
      <DashboardHeader 
        detailer={detailer}
        todaysEarnings={todaysEarnings}
        onLogout={handleLogout}
        onNavigateHome={handleNavigateHome}
      />

      {/* Active Job Banner */}
      <ActiveJobBanner 
        activeJob={activeJob}
        calculateWorkTime={calculateWorkTime}
        onCompleteJob={handleCompleteJob}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <StatsCards 
          statusCounts={statusCounts}
          todaysEarnings={todaysEarnings}
        />

        {/* Today's Schedule */}
        <TodaysSchedule todayBookings={todayBookings} />

        {/* Job Filters */}
        <JobFilters 
          filter={filter}
          setFilter={setFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          statusCounts={statusCounts}
          onRefresh={fetchBookings}
          isLoading={isLoading}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs Display */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your jobs...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'ALL' ? 'No jobs assigned yet' : `No ${filter.toLowerCase().replace('_', ' ')} jobs`}
            </h3>
            <p className="text-gray-600">
              {filter === 'ALL' 
                ? 'Jobs will appear here when they are assigned to you.'
                : `You don't have any ${filter.toLowerCase().replace('_', ' ')} jobs at the moment.`
              }
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView 
            bookings={filteredBookings}
            onStatusUpdate={handleStatusUpdate}
            onEditNotes={(booking) => setNotesModal({ show: true, booking })}
            timeTracking={timeTracking}
            calculateWorkTime={calculateWorkTime}
            activeJob={activeJob}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <ProfessionalJobCard
                key={booking.id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                onEditNotes={(booking) => setNotesModal({ show: true, booking })}
                timeTracking={timeTracking[booking.id]}
                calculateWorkTime={() => calculateWorkTime(booking.id)}
                isActive={activeJob?.id === booking.id}
                onStartNavigation={handleStartNavigation}
              />
            ))}
          </div>
        )}

        {/* Notes Modal */}
        {notesModal.show && (
          <NotesModal
            booking={notesModal.booking}
            onClose={() => setNotesModal({ show: false, booking: null })}
            onSave={handleUpdateNotes}
          />
        )}
      </main>
    </div>
  );
};

export default DetailerDashboard;