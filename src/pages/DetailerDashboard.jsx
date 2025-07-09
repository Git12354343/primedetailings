// src/pages/DetailerDashboard.jsx - Enhanced with Calendar View and Notes
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  User, 
  Briefcase,
  RefreshCw,
  Home,
  List,
  CalendarDays,
  StickyNote,
  Edit3,
  Save,
  X,
  Phone,
  Car,
  Package,
  Wrench
} from 'lucide-react';
import DashboardJobCard from '../components/DashboardJobCard';

const DetailerDashboard = () => {
  const [detailer, setDetailer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [notesModal, setNotesModal] = useState({ show: false, booking: null });
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('detailerToken');
    const detailerInfo = localStorage.getItem('detailerInfo');
    
    if (!token || !detailerInfo) {
      navigate('/detailer-login');
      return;
    }

    setDetailer(JSON.parse(detailerInfo));
    fetchBookings();
  }, [navigate]);

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
    navigate('/detailer-login');
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    setBookings(bookings.map(booking => 
      booking.id === bookingId 
        ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
        : booking
    ));
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
        // Update local state
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

  const getFilteredBookings = () => {
    if (filter === 'ALL') return bookings;
    return bookings.filter(booking => booking.status === filter);
  };

  const getStatusCounts = () => {
    return {
      CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
      IN_PROGRESS: bookings.filter(b => b.status === 'IN_PROGRESS').length,
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

  const getUpcomingBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= today && booking.status !== 'COMPLETED';
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const upcomingBookings = getUpcomingBookings();
  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prime Detailing</h1>
              <p className="text-sm text-gray-600">Detailer Dashboard</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                <span className="text-sm">Website</span>
              </button>
              
              <div className="flex items-center text-gray-700">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{detailer?.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {detailer?.name}!
          </h2>
          <p className="text-gray-600">
            Here are your assigned jobs and upcoming appointments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.TOTAL}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.CONFIRMED}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.IN_PROGRESS}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.COMPLETED}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        {todayBookings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">Today's Schedule</h3>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {todayBookings.length} {todayBookings.length === 1 ? 'job' : 'jobs'}
              </span>
            </div>
            <div className="space-y-2">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{booking.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Toggle and Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Jobs ({statusCounts.TOTAL})
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'CONFIRMED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Confirmed ({statusCounts.CONFIRMED})
            </button>
            <button
              onClick={() => setFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'IN_PROGRESS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              In Progress ({statusCounts.IN_PROGRESS})
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Completed ({statusCounts.COMPLETED})
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Calendar
              </button>
            </div>

            <button
              onClick={fetchBookings}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

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

        {/* Content based on view mode */}
        {viewMode === 'calendar' ? (
          <CalendarView 
            bookings={filteredBookings}
            onStatusUpdate={handleStatusUpdate}
            onEditNotes={(booking) => setNotesModal({ show: true, booking })}
          />
        ) : (
          <ListView 
            bookings={filteredBookings}
            isLoading={isLoading}
            filter={filter}
            onStatusUpdate={handleStatusUpdate}
            onEditNotes={(booking) => setNotesModal({ show: true, booking })}
          />
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

// Calendar View Component
const CalendarView = ({ bookings, onStatusUpdate, onEditNotes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Get the first day of the month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const formatDate = (year, month, day) => {
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getBookingsForDay = (day) => {
    if (!day) return [];
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date).toISOString().split('T')[0];
      return bookingDate === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-orange-500';
      case 'COMPLETED':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = day && 
              currentDate.getFullYear() === new Date().getFullYear() &&
              currentDate.getMonth() === new Date().getMonth() &&
              day === new Date().getDate();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-200 rounded-lg ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 2).map(booking => (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`text-xs p-1 rounded cursor-pointer text-white truncate ${getStatusColor(booking.status)}`}
                          title={`${booking.customer.firstName} ${booking.customer.lastName} - ${booking.time}`}
                        >
                          {booking.time} - {booking.customer.firstName}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-gray-500 p-1">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={onStatusUpdate}
          onEditNotes={onEditNotes}
        />
      )}
    </div>
  );
};

// List View Component
const ListView = ({ bookings, isLoading, filter, onStatusUpdate, onEditNotes }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your jobs...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => (
        <EnhancedJobCard
          key={booking.id}
          booking={booking}
          onStatusUpdate={onStatusUpdate}
          onEditNotes={onEditNotes}
        />
      ))}
    </div>
  );
};

// Enhanced Job Card with Notes
const EnhancedJobCard = ({ booking, onStatusUpdate, onEditNotes }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleMarkCompleted = async () => {
    if (booking.status === 'COMPLETED') return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('detailerToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        onStatusUpdate(booking.id, 'COMPLETED');
      } else {
        alert('Failed to update status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (booking.status === newStatus) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('detailerToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        onStatusUpdate(booking.id, newStatus);
      } else {
        alert('Failed to update status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Parse services safely
  const parseServices = (services) => {
    try {
      if (Array.isArray(services)) {
        return services;
      }
      if (typeof services === 'string') {
        return JSON.parse(services);
      }
      return [];
    } catch (error) {
      console.error('Error parsing services:', error);
      return [];
    }
  };

  // Parse extras safely
  const parseExtras = (extras) => {
    try {
      if (Array.isArray(extras)) {
        return extras;
      }
      if (typeof extras === 'string' && extras) {
        return JSON.parse(extras);
      }
      return [];
    } catch (error) {
      console.error('Error parsing extras:', error);
      return [];
    }
  };

  const services = parseServices(booking.services);
  const extras = parseExtras(booking.extras);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            {booking.customer.firstName} {booking.customer.lastName}
          </h3>
          <p className="text-sm text-gray-500">Booking #{booking.confirmationCode}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusColor(booking.status)}`}>
            {getStatusIcon(booking.status)}
            <span className="ml-1">{booking.status.replace('_', ' ')}</span>
          </div>
          
          <button
            onClick={() => onEditNotes(booking)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          <span className="text-sm">{booking.customer.phoneNumber}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="text-sm">{formatDate(booking.date)}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm">{formatTime(booking.time)}</span>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <Car className="w-4 h-4 mr-2 text-blue-600" />
          <span className="font-medium text-gray-900">Vehicle Details</span>
        </div>
        <p className="text-sm text-gray-600">
          {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
        </p>
        <p className="text-xs text-gray-500 capitalize">{booking.vehicle.type}</p>
      </div>

      {/* Services */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Wrench className="w-4 h-4 mr-2 text-blue-600" />
          <span className="font-medium text-gray-900">Services</span>
        </div>
        <div className="space-y-1">
          {services.length > 0 ? (
            services.map((service, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1"
              >
                {service}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-xs">No services listed</span>
          )}
        </div>
        
        {/* Extras */}
        {extras.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center mb-2">
              <Package className="w-4 h-4 mr-2 text-green-600" />
              <span className="font-medium text-gray-900">Add-ons</span>
            </div>
            <div className="space-y-1">
              {extras.map((extra, index) => (
                <span
                  key={index}
                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2 mb-1"
                >
                  {extra}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes Preview */}
      {booking.notes && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-1">
            <StickyNote className="w-4 h-4 mr-2 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Notes</span>
          </div>
          <p className="text-sm text-yellow-700 line-clamp-2">{booking.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {booking.status === 'CONFIRMED' && (
          <button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            disabled={isUpdating}
            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Start Job'}
          </button>
        )}
        
        {booking.status === 'IN_PROGRESS' && (
          <button
            onClick={handleMarkCompleted}
            disabled={isUpdating}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Mark Complete'}
          </button>
        )}
        
        {booking.status === 'COMPLETED' && (
          <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center text-sm font-medium">
            Job Completed
          </div>
        )}
      </div>
    </div>
  );
};

// Booking Detail Modal for Calendar View
const BookingDetailModal = ({ booking, onClose, onStatusUpdate, onEditNotes }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.customer.firstName} {booking.customer.lastName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <EnhancedJobCard
            booking={booking}
            onStatusUpdate={onStatusUpdate}
            onEditNotes={onEditNotes}
          />
        </div>
      </div>
    </div>
  );
};

// Notes Modal Component
const NotesModal = ({ booking, onClose, onSave }) => {
  const [notes, setNotes] = useState(booking?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(booking.id, notes);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Job Notes - {booking.customer.firstName} {booking.customer.lastName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add private notes about this job... (e.g., customer preferences, gate codes, specific instructions, job observations)"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are private and only visible to detailers
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailerDashboard;