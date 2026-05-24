import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsCards from '../components/dashboard/StatsCards';
import TodaysSchedule from '../components/dashboard/TodaysSchedule';
import ActiveJobBanner from '../components/dashboard/ActiveJobBanner';
import JobFilters from '../components/dashboard/JobFilters';
import ProfessionalJobCard from '../components/dashboard/ProfessionalJobCard';
import CalendarView from '../components/dashboard/CalendarView';
import NotesModal from '../components/dashboard/NotesModal';
import SmartNotificationsSystem from '../components/dashboard/SmartNotificationsSystem';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376, #c9a84c)';

const DetailerDashboard = () => {
  const [detailer, setDetailer]     = useState(null);
  const [bookings, setBookings]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('ALL');
  const [viewMode, setViewMode]     = useState('list');
  const [notesModal, setNotesModal] = useState({ show: false, booking: null });
  const [activeJob, setActiveJob]   = useState(null);
  const [timeTracking, setTimeTracking] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('detailerToken');
    const detailerInfo = localStorage.getItem('detailerInfo');
    if (!token || !detailerInfo) { navigate('/detailer-login'); return; }
    setDetailer(JSON.parse(detailerInfo));
    fetchBookings();
    const savedJob = localStorage.getItem('activeJob');
    const savedTracking = localStorage.getItem('timeTracking');
    if (savedJob) setActiveJob(JSON.parse(savedJob));
    if (savedTracking) setTimeTracking(JSON.parse(savedTracking));
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('timeTracking', JSON.stringify(timeTracking));
  }, [timeTracking]);

  useEffect(() => {
    if (activeJob) localStorage.setItem('activeJob', JSON.stringify(activeJob));
    else localStorage.removeItem('activeJob');
  }, [activeJob]);

  // Auto-refresh token on 401, retry once
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('detailerToken');
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      // Try to refresh
      const refreshToken = localStorage.getItem('detailerRefreshToken');
      if (!refreshToken) { navigate('/detailer-login'); return res; }

      const refreshRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshData = await refreshRes.json();

      if (!refreshData.success) {
        // Refresh failed — session truly expired, force re-login
        ['detailerToken', 'detailerRefreshToken', 'detailerInfo', 'activeJob', 'timeTracking']
          .forEach(k => localStorage.removeItem(k));
        navigate('/detailer-login');
        return res;
      }

      // Store new tokens and retry original request
      localStorage.setItem('detailerToken', refreshData.token);
      localStorage.setItem('detailerRefreshToken', refreshData.refreshToken);

      return fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${refreshData.token}` },
      });
    }

    return res;
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bookings/assigned`);
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
      else setError(data.message || 'Failed to fetch bookings');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    ['detailerToken', 'detailerRefreshToken', 'detailerInfo', 'activeJob', 'timeTracking'].forEach(k => localStorage.removeItem(k));
    navigate('/detailer-login');
  };

  // Optimistic status update — update UI immediately, roll back on failure
  const handleStatusUpdate = async (bookingId, newStatus) => {
    const prev = bookings.find(b => b.id === bookingId);
    // Optimistic update
    setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: newStatus, updatedAt: new Date().toISOString() } : b));
    if (newStatus === 'IN_PROGRESS') startTimeTracking(bookingId);
    else if (newStatus === 'COMPLETED') stopTimeTracking(bookingId);

    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      // Patch with server timeline if available
      if (data.booking?.timeline) {
        setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, timeline: data.booking.timeline } : b));
      }
    } catch (err) {
      // Roll back on failure
      setBookings(bs => bs.map(b => b.id === bookingId ? prev : b));
      setError(`Failed to update status: ${err.message}`);
      setTimeout(() => setError(''), 4000);
    }
  };

  const startTimeTracking = (bookingId) => {
    const now = new Date().toISOString();
    setTimeTracking(p => ({ ...p, [bookingId]: { ...p[bookingId], startTime: now, isActive: true } }));
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) setActiveJob(booking);
  };

  const stopTimeTracking = (bookingId) => {
    const now = new Date().toISOString();
    setTimeTracking(p => ({ ...p, [bookingId]: { ...p[bookingId], endTime: now, isActive: false } }));
    if (activeJob?.id === bookingId) setActiveJob(null);
  };

  const calculateWorkTime = (bookingId) => {
    const t = timeTracking[bookingId];
    if (!t?.startTime) return '0h 0m';
    const diff = (t.endTime ? new Date(t.endTime) : new Date()) - new Date(t.startTime);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const handleUpdateNotes = async (bookingId, notes) => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, notes, updatedAt: new Date().toISOString() } : b));
        setNotesModal({ show: false, booking: null });
      } else setError(data.message || 'Failed to update notes');
    } catch { setError('Network error.'); }
  };

  const handleCompleteJob = (jobId) => handleStatusUpdate(jobId, 'COMPLETED');
  const handleStartNavigation = (booking) => {
    if (booking.status === 'CONFIRMED') handleStatusUpdate(booking.id, 'EN_ROUTE');
  };

  const getFilteredBookings = () => {
    if (filter === 'ALL') return bookings;
    if (filter === 'IN_PROGRESS') return bookings.filter(b => ['IN_PROGRESS', 'STARTED', 'EN_ROUTE'].includes(b.status));
    return bookings.filter(b => b.status === filter);
  };

  const getStatusCounts = () => ({
    CONFIRMED:   bookings.filter(b => b.status === 'CONFIRMED').length,
    IN_PROGRESS: bookings.filter(b => ['IN_PROGRESS', 'STARTED', 'EN_ROUTE'].includes(b.status)).length,
    COMPLETED:   bookings.filter(b => b.status === 'COMPLETED').length,
    TOTAL:       bookings.length,
  });

  const getTodayBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => new Date(b.date).toISOString().split('T')[0] === today);
  };

  const getTodaysEarnings = () =>
    getTodayBookings()
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice ? parseFloat(b.totalPrice) : 0), 0);

  // Loading screen
  if (isLoading && !detailer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: GOLD }}>
            <Loader2 className="w-7 h-7 text-black animate-spin" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusCounts    = getStatusCounts();
  const todayBookings   = getTodayBookings();
  const filteredBookings = getFilteredBookings();
  const todaysEarnings  = getTodaysEarnings();

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <SmartNotificationsSystem jobs={bookings} onJobAction={handleStatusUpdate} userRole="detailer" />

      <DashboardHeader
        detailer={detailer}
        todaysEarnings={todaysEarnings}
        onLogout={handleLogout}
        onNavigateHome={() => navigate('/')}
      />

      <ActiveJobBanner activeJob={activeJob} calculateWorkTime={calculateWorkTime} onCompleteJob={handleCompleteJob} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatsCards statusCounts={statusCounts} todaysEarnings={todaysEarnings} />
        <TodaysSchedule todayBookings={todayBookings} />
        <JobFilters
          filter={filter} setFilter={setFilter}
          viewMode={viewMode} setViewMode={setViewMode}
          statusCounts={statusCounts} onRefresh={fetchBookings} isLoading={isLoading}
        />

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={fetchBookings} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#f87171' }}>
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Jobs display */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#c9a84c' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading your jobs...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Briefcase className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {filter === 'ALL' ? 'No jobs assigned yet' : `No ${filter.toLowerCase().replace('_', ' ')} jobs`}
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {filter === 'ALL' ? 'Jobs will appear here when assigned to you.' : `You don't have any ${filter.toLowerCase().replace('_', ' ')} jobs right now.`}
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            bookings={filteredBookings}
            onStatusUpdate={handleStatusUpdate}
            onEditNotes={(b) => setNotesModal({ show: true, booking: b })}
            timeTracking={timeTracking}
            calculateWorkTime={calculateWorkTime}
            activeJob={activeJob}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map(booking => (
              <ProfessionalJobCard
                key={booking.id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                onEditNotes={(b) => setNotesModal({ show: true, booking: b })}
                timeTracking={timeTracking[booking.id]}
                calculateWorkTime={() => calculateWorkTime(booking.id)}
                isActive={activeJob?.id === booking.id}
                onStartNavigation={handleStartNavigation}
              />
            ))}
          </div>
        )}

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
