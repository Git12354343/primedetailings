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
  LogOut,
  Settings,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  Loader2,
  Package,
  Save,
  RotateCcw
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
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
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

  // Fetch services
  const fetchServices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      } else {
        console.log('Failed to fetch services:', data.message);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch add-ons
  const fetchAddOns = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons`);
      const data = await response.json();
      
      if (data.success) {
        setAddOns(data.addOns);
      } else {
        console.log('Failed to fetch add-ons:', data.message);
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUnassignedBookings(), 
        fetchActiveDetailers(), 
        fetchAllBookings(),
        fetchServices(),
        fetchAddOns()
      ]);
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
                onClick={() => { 
                  fetchUnassignedBookings(); 
                  fetchActiveDetailers(); 
                  fetchAllBookings();
                  fetchServices();
                  fetchAddOns();
                }}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-semibold text-gray-900">{services.filter(s => s.isActive).length}</p>
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
              <button
                onClick={() => setActiveTab('services')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Services Management ({services.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'services' ? (
          <ServiceManagement 
            services={services}
            addOns={addOns}
            onRefresh={() => {
              fetchServices();
              fetchAddOns();
            }}
          />
        ) : (
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
        )}
      </main>
    </div>
  );
};

// Service Management Component
const ServiceManagement = ({ services, addOns, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState('services');
  const [editingService, setEditingService] = useState(null);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateAddOn, setShowCreateAddOn] = useState(false);

  const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Coupe'];
  const serviceCategories = ['DETAILING', 'PROTECTION', 'RESTORATION', 'MAINTENANCE', 'SPECIALTY'];
  const addOnCategories = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];

  const handleCreateService = async (serviceData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setShowCreateService(false);
        alert('Service created successfully!');
      } else {
        alert('Failed to create service: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleUpdateService = async (serviceId, serviceData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setEditingService(null);
        alert('Service updated successfully!');
      } else {
        alert('Failed to update service: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${serviceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        alert('Service deactivated successfully!');
      } else {
        alert('Failed to deactivate service: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleCreateAddOn = async (addOnData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addOnData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setShowCreateAddOn(false);
        alert('Add-on created successfully!');
      } else {
        alert('Failed to create add-on: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating add-on:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleUpdateAddOn = async (addOnId, addOnData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons/${addOnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addOnData)
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        setEditingAddOn(null);
        alert('Add-on updated successfully!');
      } else {
        alert('Failed to update add-on: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating add-on:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteAddOn = async (addOnId) => {
    if (!confirm('Are you sure you want to deactivate this add-on?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons/${addOnId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        onRefresh();
        alert('Add-on deactivated successfully!');
      } else {
        alert('Failed to deactivate add-on: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Management Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Service & Pricing Management</h2>
            <p className="text-gray-600">Manage your services and pricing without requiring a developer</p>
          </div>
          <div className="flex space-x-3">
            {activeSubTab === 'services' && (
              <button
                onClick={() => setShowCreateService(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </button>
            )}
            {activeSubTab === 'addons' && (
              <button
                onClick={() => setShowCreateAddOn(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Add-on
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSubTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveSubTab('addons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'addons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Add-ons ({addOns.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Services List */}
      {activeSubTab === 'services' && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                vehicleTypes={vehicleTypes}
                serviceCategories={serviceCategories}
                isEditing={editingService === service.id}
                onEdit={() => setEditingService(service.id)}
                onCancelEdit={() => setEditingService(null)}
                onUpdate={(data) => handleUpdateService(service.id, data)}
                onDelete={() => handleDeleteService(service.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add-ons List */}
      {activeSubTab === 'addons' && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {addOns.map((addOn) => (
              <AddOnRow
                key={addOn.id}
                addOn={addOn}
                addOnCategories={addOnCategories}
                isEditing={editingAddOn === addOn.id}
                onEdit={() => setEditingAddOn(addOn.id)}
                onCancelEdit={() => setEditingAddOn(null)}
                onUpdate={(data) => handleUpdateAddOn(addOn.id, data)}
                onDelete={() => handleDeleteAddOn(addOn.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {showCreateService && (
        <CreateServiceModal
          vehicleTypes={vehicleTypes}
          serviceCategories={serviceCategories}
          onClose={() => setShowCreateService(false)}
          onCreate={handleCreateService}
        />
      )}

      {/* Create Add-on Modal */}
      {showCreateAddOn && (
        <CreateAddOnModal
          addOnCategories={addOnCategories}
          onClose={() => setShowCreateAddOn(false)}
          onCreate={handleCreateAddOn}
        />
      )}
    </div>
  );
};

// Service Row Component
const ServiceRow = ({ service, vehicleTypes, serviceCategories, isEditing, onEdit, onCancelEdit, onUpdate, onDelete }) => {
  const [editData, setEditData] = useState({
    name: service.name,
    description: service.description || '',
    category: service.category,
    isActive: service.isActive,
    sortOrder: service.sortOrder,
    pricing: service.pricing
  });

  const handleSave = () => {
    if (!editData.name.trim()) {
      alert('Service name is required');
      return;
    }

    // Validate pricing
    const missingPricing = vehicleTypes.filter(type => 
      !editData.pricing[type] || editData.pricing[type] <= 0
    );

    if (missingPricing.length > 0) {
      alert(`Please set valid pricing for: ${missingPricing.join(', ')}`);
      return;
    }

    onUpdate(editData);
  };

  if (isEditing) {
    return (
      <div className="p-6 bg-blue-50">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing by Vehicle Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vehicleTypes.map(type => (
                <div key={type}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{type}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editData.pricing[type] || ''}
                      onChange={(e) => setEditData({
                        ...editData, 
                        pricing: {...editData.pricing, [type]: parseFloat(e.target.value) || 0}
                      })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editData.isActive}
                onChange={(e) => setEditData({...editData, isActive: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <input
                type="number"
                value={editData.sortOrder}
                onChange={(e) => setEditData({...editData, sortOrder: parseInt(e.target.value) || 0})}
                className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save className="w-4 h-4 inline mr-1" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              service.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {service.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {service.category}
            </span>
          </div>
          {service.description && (
            <p className="text-gray-600 mt-1">{service.description}</p>
          )}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {vehicleTypes.map(type => (
              <div key={type} className="text-sm">
                <span className="font-medium text-gray-700">{type}:</span>
                <span className="ml-1 text-green-600 font-semibold">
                  ${service.pricing[type] || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Edit Service"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Deactivate Service"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Add-on Row Component with better UX
const EnhancedAddOnRow = ({ addOn, addOnCategories, isEditing, onEdit, onCancelEdit, onUpdate, onDelete }) => {
  const [editData, setEditData] = useState({
    name: addOn.name,
    description: addOn.description || '',
    category: addOn.category,
    price: addOn.price,
    isActive: addOn.isActive,
    sortOrder: addOn.sortOrder
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editData.name.trim()) {
      alert('Add-on name is required');
      return;
    }

    if (editData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons/${addOn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const data = await response.json();
      
      if (data.success) {
        onUpdate(editData);
        onCancelEdit();
        alert('Add-on updated successfully!');
      } else {
        alert('Failed to update add-on: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating add-on:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to deactivate "${addOn.name}"? This will remove it from the booking form.`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons/${addOn.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        onDelete();
        alert('Add-on deactivated successfully!');
      } else {
        alert('Failed to deactivate add-on: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add-on Name *</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
                placeholder="e.g., Engine Bay Cleaning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
              >
                {addOnCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Describe what this add-on includes and its benefits..."
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">This description will be shown to customers on the booking form</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value) || 0})}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({...editData, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active {!editData.isActive && <span className="text-red-600">(Hidden from customers)</span>}
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={editData.sortOrder}
                onChange={(e) => setEditData({...editData, sortOrder: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                min="0"
                disabled={isLoading}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancelEdit}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{addOn.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              addOn.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {addOn.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
              {addOn.category}
            </span>
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-semibold">
              ${addOn.price}
            </span>
          </div>
          {addOn.description && (
            <p className="text-gray-600 mb-2">{addOn.description}</p>
          )}
          <div className="text-sm text-gray-500">
            Sort: {addOn.sortOrder} • 
            {addOn.isActive ? ' Visible to customers' : ' Hidden from booking form'}
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 transition-colors"
            title="Edit Add-on"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
            title={addOn.isActive ? "Deactivate Add-on" : "This add-on is already inactive"}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Service Modal Component
const CreateServiceModal = ({ vehicleTypes, serviceCategories, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'DETAILING',
    sortOrder: 0,
    pricing: vehicleTypes.reduce((acc, type) => ({ ...acc, [type]: 0 }), {})
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Service name is required');
      return;
    }

    const missingPricing = vehicleTypes.filter(type => 
      !formData.pricing[type] || formData.pricing[type] <= 0
    );

    if (missingPricing.length > 0) {
      alert(`Please set valid pricing for: ${missingPricing.join(', ')}`);
      return;
    }

    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Create New Service</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the service..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing by Vehicle Type *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vehicleTypes.map(type => (
                <div key={type}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{type}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.pricing[type] || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        pricing: {...formData.pricing, [type]: parseFloat(e.target.value) || 0}
                      })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Create Add-on Modal Component
const CreateAddOnModal = ({ addOnCategories, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ENHANCEMENT',
    price: 0,
    sortOrder: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Add-on name is required');
      return;
    }

    if (formData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onCreate();
        onClose();
        alert('Add-on created successfully! It will now appear on the booking form.');
      } else {
        alert('Failed to create add-on: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating add-on:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Add-on</h3>
              <p className="text-sm text-gray-600">This will appear as an option on the booking form</p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add-on Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Engine Bay Cleaning"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
              >
                {addOnCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Describe what this add-on includes and its benefits..."
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Customers will see this description when selecting add-ons</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                min="0"
                placeholder="0"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first on the form</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Add-ons will automatically appear on the booking form once created. 
              Make sure your description clearly explains the value to customers.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Add-on
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Booking Card Component (unchanged from original)
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