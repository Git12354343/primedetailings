import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Users,
  Briefcase,
  Search,
  X,
  Shield,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut
} from 'lucide-react';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const ADMIN_PASSWORD = 'primeadmin2024';

  // Check if already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-800 p-3 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Prime Detailing</h1>
            <p className="text-gray-600">Admin Portal</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <LogIn className="w-6 h-6 text-gray-800 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Admin Access</h2>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{loginError}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleLogin}
                className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 font-medium"
              >
                Access Admin Dashboard
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Demo Admin Password:</p>
              <div className="text-xs text-gray-500">
                <p><strong>Password:</strong> primeadmin2024</p>
              </div>
            </div>

            {/* Back to Website */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Website
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

// Admin Dashboard Component
const AdminDashboard = ({ onLogout }) => {
  const [unassignedBookings, setUnassignedBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [activeDetailers, setActiveDetailers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('unassigned');

  // Fetch all bookings (for the "All Bookings" tab)
  const fetchAllBookings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/all-bookings`);
      const data = await response.json();
      
      if (data.success) {
        setAllBookings(data.bookings);
      } else {
        console.log('Failed to fetch all bookings:', data.message);
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error);
    }
  };

  // Fetch unassigned bookings
  const fetchUnassignedBookings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/unassigned-bookings`);
      const data = await response.json();
      
      if (data.success) {
        setUnassignedBookings(data.bookings);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Network error fetching bookings');
    }
  };

  // Fetch active detailers
  const fetchActiveDetailers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/active-detailers`);
      const data = await response.json();
      
      if (data.success) {
        setActiveDetailers(data.detailers);
      } else {
        setError('Failed to fetch detailers');
      }
    } catch (error) {
      console.error('Error fetching detailers:', error);
      setError('Network error fetching detailers');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUnassignedBookings(), fetchActiveDetailers(), fetchAllBookings()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Assign booking to detailer
  const handleAssignBooking = async (bookingId, detailerId) => {
    setAssigningBooking(bookingId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/assign-detailer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: bookingId,
          detailerId: detailerId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove booking from unassigned list
        setUnassignedBookings(prev => prev.filter(booking => booking.id !== bookingId));
        // Update detailer's active booking count
        setActiveDetailers(prev => 
          prev.map(detailer => 
            detailer.id === parseInt(detailerId)
              ? { ...detailer, activeBookings: detailer.activeBookings + 1 }
              : detailer
          )
        );
        // Refresh all bookings
        fetchAllBookings();
        alert(`Booking assigned successfully to ${data.booking.detailerName}`);
      } else {
        alert('Failed to assign booking: ' + data.message);
      }
    } catch (error) {
      console.error('Error assigning booking:', error);
      alert('Network error. Please try again.');
    } finally {
      setAssigningBooking(null);
    }
  };

  // Auto-assign booking
  const handleAutoAssign = async (bookingId) => {
    setAssigningBooking(bookingId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      });

      const data = await response.json();
      
      if (data.success) {
        setUnassignedBookings(prev => prev.filter(booking => booking.id !== bookingId));
        // Refresh all bookings and detailers
        fetchAllBookings();
        fetchActiveDetailers();
        alert(`Booking auto-assigned to ${data.booking.detailerName}`);
      } else {
        alert('Failed to auto-assign booking: ' + data.message);
      }
    } catch (error) {
      console.error('Error auto-assigning booking:', error);
      alert('Network error. Please try again.');
    } finally {
      setAssigningBooking(null);
    }
  };

  // Filter bookings based on search and status
  const filteredUnassignedBookings = unassignedBookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.phoneNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredAllBookings = allBookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.phoneNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prime Detailing</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { fetchUnassignedBookings(); fetchActiveDetailers(); fetchAllBookings(); }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unassigned Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{unassignedBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Detailers</p>
                <p className="text-2xl font-semibold text-gray-900">{activeDetailers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{allBookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('unassigned')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'unassigned'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Unassigned Bookings ({unassignedBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Bookings ({allBookings.length})
              </button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bookings Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {activeTab === 'unassigned' ? 'Unassigned Bookings' : 'All Bookings'}
                </h2>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or confirmation code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {activeTab === 'unassigned' ? (
                  filteredUnassignedBookings.length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                      <p className="text-gray-600">No unassigned bookings at the moment.</p>
                    </div>
                  ) : (
                    filteredUnassignedBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        detailers={activeDetailers}
                        onAssign={handleAssignBooking}
                        onAutoAssign={handleAutoAssign}
                        isAssigning={assigningBooking === booking.id}
                        showAssignActions={true}
                      />
                    ))
                  )
                ) : (
                  filteredAllBookings.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                      <p className="text-gray-600">No bookings match your search criteria.</p>
                    </div>
                  ) : (
                    filteredAllBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        detailers={activeDetailers}
                        onAssign={handleAssignBooking}
                        onAutoAssign={handleAutoAssign}
                        isAssigning={assigningBooking === booking.id}
                        showAssignActions={!booking.detailerId}
                      />
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* Active Detailers */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Active Detailers</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {activeDetailers.map((detailer) => (
                  <div key={detailer.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{detailer.name}</h3>
                        <p className="text-sm text-gray-600">{detailer.email}</p>
                        <p className="text-sm text-gray-600">{detailer.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {detailer.activeBookings} jobs
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          detailer.activeBookings === 0 
                            ? 'bg-green-100 text-green-800' 
                            : detailer.activeBookings <= 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {detailer.activeBookings === 0 ? 'Available' : 
                           detailer.activeBookings <= 2 ? 'Busy' : 'Very Busy'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Booking Card Component
const BookingCard = ({ booking, detailers, onAssign, onAutoAssign, isAssigning, showAssignActions = true }) => {
  const [selectedDetailer, setSelectedDetailer] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleManualAssign = () => {
    if (selectedDetailer) {
      onAssign(booking.id, selectedDetailer);
      setShowAssignDropdown(false);
      setSelectedDetailer('');
    }
  };

  // Find detailer name if assigned
  const assignedDetailer = booking.detailerId 
    ? detailers.find(d => d.id === booking.detailerId)
    : null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            {booking.customer.firstName} {booking.customer.lastName}
          </h3>
          <p className="text-sm text-gray-500">#{booking.confirmationCode}</p>
          {assignedDetailer && (
            <p className="text-sm text-green-600 font-medium mt-1">
              Assigned to: {assignedDetailer.name}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          booking.status === 'PENDING' 
            ? 'bg-yellow-100 text-yellow-800' 
            : booking.status === 'CONFIRMED'
            ? 'bg-blue-100 text-blue-800'
            : booking.status === 'IN_PROGRESS'
            ? 'bg-orange-100 text-orange-800'
            : booking.status === 'COMPLETED'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {booking.status.replace('_', ' ')}
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            {booking.customer.phoneNumber}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(booking.date)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {formatTime(booking.time)}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Car className="w-4 h-4 mr-2" />
            {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
          </div>
          <div className="text-sm text-gray-600 capitalize">
            {booking.vehicle.type}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Services:</h4>
        <div className="flex flex-wrap gap-2">
          {(() => {
            try {
              const services = Array.isArray(booking.services) 
                ? booking.services 
                : JSON.parse(booking.services || '[]');
              return services.map((service, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {service}
                </span>
              ));
            } catch (e) {
              return <span className="text-gray-500 text-xs">No services</span>;
            }
          })()}
          {(() => {
            try {
              const extras = Array.isArray(booking.extras) 
                ? booking.extras 
                : JSON.parse(booking.extras || '[]');
              return extras.map((extra, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                >
                  {extra}
                </span>
              ));
            } catch (e) {
              return null;
            }
          })()}
        </div>
      </div>

      {/* Assignment Actions - Only show for unassigned bookings */}
      {showAssignActions && (
        <div className="border-t pt-4">
          {!showAssignDropdown ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAutoAssign(booking.id)}
                disabled={isAssigning}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isAssigning ? 'Assigning...' : 'Auto Assign'}
              </button>
              <button
                onClick={() => setShowAssignDropdown(true)}
                disabled={isAssigning}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Manual Assign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Select Detailer:</label>
                <button
                  onClick={() => {
                    setShowAssignDropdown(false);
                    setSelectedDetailer('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <select
                value={selectedDetailer}
                onChange={(e) => setSelectedDetailer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a detailer...</option>
                {detailers.map((detailer) => (
                  <option key={detailer.id} value={detailer.id}>
                    {detailer.name} ({detailer.activeBookings} active jobs)
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleManualAssign}
                  disabled={!selectedDetailer || isAssigning}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status info for assigned bookings */}
      {!showAssignActions && booking.status === 'COMPLETED' && (
        <div className="border-t pt-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800 font-medium">✅ Job Completed</p>
            <p className="text-xs text-green-600">This booking has been finished by the detailer.</p>
          </div>
        </div>
      )}
      
      {!showAssignActions && booking.status === 'IN_PROGRESS' && (
        <div className="border-t pt-4">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-800 font-medium">🚧 Job In Progress</p>
            <p className="text-xs text-orange-600">The detailer is currently working on this booking.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;