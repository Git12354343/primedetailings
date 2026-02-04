// src/pages/BookingLookup.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  MapPin,
  Car,
  Package,
  Wrench,
  User,
  Mail,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const BookingLookup = () => {
  const [searchData, setSearchData] = useState({
    confirmationCode: '',
    phone: ''
  });
  const [booking, setBooking] = useState(null);
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch services and addons when component mounts
  useEffect(() => {
    const fetchServicesAndAddOns = async () => {
      try {
        const [servicesResponse, addOnsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/services`),
          fetch(`${import.meta.env.VITE_API_URL}/services/addons`)
        ]);

        const servicesData = await servicesResponse.json();
        const addOnsData = await addOnsResponse.json();

        if (servicesData.success) {
          setServices(servicesData.services);
        }

        if (addOnsData.success) {
          setAddOns(addOnsData.addOns);
        }
      } catch (error) {
        console.error('Error fetching services/addons:', error);
      }
    };

    fetchServicesAndAddOns();
  }, []);

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return cleaned;
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setSearchData({ ...searchData, phone: formatted });
  };

  // FIXED: Helper function to resolve service IDs to names
  const resolveServiceNames = (serviceData) => {
    try {
      let serviceIds = [];
      if (typeof serviceData === 'string') {
        serviceIds = JSON.parse(serviceData || '[]');
      } else if (Array.isArray(serviceData)) {
        serviceIds = serviceData;
      }

      // Check if they are already names (strings) or IDs (numbers)
      const areIds = serviceIds.length > 0 && serviceIds.every(item => 
        !isNaN(parseInt(item)) || typeof item === 'number'
      );

      if (areIds && services.length > 0) {
        // Map IDs to names
        return serviceIds.map(id => {
          const service = services.find(s => s.id === parseInt(id));
          return service ? service.name : `Service ID: ${id}`;
        });
      } else {
        // Already names or services not loaded yet
        return serviceIds;
      }
    } catch (error) {
      console.error('Error resolving service names:', error);
      return [];
    }
  };

  // FIXED: Helper function to resolve add-on IDs to names
  const resolveAddOnNames = (addOnData) => {
    try {
      let addOnIds = [];
      if (typeof addOnData === 'string') {
        addOnIds = JSON.parse(addOnData || '[]');
      } else if (Array.isArray(addOnData)) {
        addOnIds = addOnData;
      }

      // Check if they are already names (strings) or IDs (numbers)
      const areIds = addOnIds.length > 0 && addOnIds.every(item => 
        !isNaN(parseInt(item)) || typeof item === 'number'
      );

      if (areIds && addOns.length > 0) {
        // Map IDs to names
        return addOnIds.map(id => {
          const addOn = addOns.find(a => a.id === parseInt(id));
          return addOn ? addOn.name : `Add-on ID: ${id}`;
        });
      } else {
        // Already names or add-ons not loaded yet
        return addOnIds;
      }
    } catch (error) {
      console.error('Error resolving add-on names:', error);
      return [];
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchData.confirmationCode.trim() || !searchData.phone.trim()) {
      setError('Please enter both confirmation code and phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setBooking(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${searchData.confirmationCode.trim()}`);
      const data = await response.json();

      if (data.success) {
        // Verify phone number matches
        const searchPhone = searchData.phone.replace(/\D/g, '');
        const bookingPhone = data.booking.customer?.phoneNumber?.replace(/\D/g, '') || 
                           data.booking.phoneNumber?.replace(/\D/g, '') || '';
        
        if (searchPhone === bookingPhone.slice(-10)) {
          setBooking(data.booking);
        } else {
          setError('Phone number does not match our records');
        }
      } else {
        setError('Booking not found. Please check your confirmation code.');
      }
    } catch (error) {
      console.error('Error searching booking:', error);
      setError('Unable to search at this time. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-600 bg-yellow-100',
          label: 'Pending Confirmation',
          description: 'Your booking is being processed and will be confirmed soon.'
        };
      case 'CONFIRMED':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-blue-600 bg-blue-100',
          label: 'Confirmed',
          description: 'Your booking is confirmed! We will contact you 24 hours before your appointment.'
        };
      case 'EN_ROUTE':
        return {
          icon: <Car className="w-5 h-5" />,
          color: 'text-indigo-600 bg-indigo-100',
          label: 'En Route',
          description: 'Our detailer is on the way to your location.'
        };
      case 'STARTED':
        return {
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'text-orange-600 bg-orange-100',
          label: 'Started',
          description: 'Our detailer has arrived and started working on your vehicle.'
        };
      case 'IN_PROGRESS':
        return {
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'text-orange-600 bg-orange-100',
          label: 'In Progress',
          description: 'Our team is currently working on your vehicle.'
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600 bg-green-100',
          label: 'Completed',
          description: 'Your detailing service has been completed successfully!'
        };
      case 'CANCELED':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-red-600 bg-red-100',
          label: 'Canceled',
          description: 'This booking has been canceled.'
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-gray-600 bg-gray-100',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

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

  // Get customer info with fallback to both old and new format
  const getCustomerInfo = (booking) => {
    if (booking.customer) {
      return {
        firstName: booking.customer.firstName,
        lastName: booking.customer.lastName,
        email: booking.customer.email,
        phoneNumber: booking.customer.phoneNumber,
        address: booking.customer.address,
        city: booking.customer.city,
        postalCode: booking.customer.postalCode
      };
    } else {
      return {
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phoneNumber: booking.phoneNumber,
        address: booking.address,
        city: booking.city,
        postalCode: booking.postalCode
      };
    }
  };

  // Get vehicle info with fallback
  const getVehicleInfo = (booking) => {
    if (booking.vehicle) {
      return {
        make: booking.vehicle.make,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        type: booking.vehicle.type
      };
    } else {
      return {
        make: booking.make,
        model: booking.model,
        year: booking.year,
        type: booking.vehicleType
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prime Detailing</h1>
              <p className="text-gray-600">Track Your Booking</p>
            </div>
            <Link
              to="/"
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!booking ? (
          <>
            {/* Search Form */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Booking Status</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Enter your confirmation code and phone number to view your appointment details and current status.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <form onSubmit={handleSearch} className="space-y-6">
                  <div>
                    <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmation Code
                    </label>
                    <input
                      type="text"
                      id="confirmationCode"
                      value={searchData.confirmationCode}
                      onChange={(e) => setSearchData({ ...searchData, confirmationCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono text-lg"
                      placeholder="e.g., ABC123"
                      maxLength="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Found in your confirmation email or SMS
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        value={searchData.phone}
                        onChange={handlePhoneChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(514) 555-0123"
                        maxLength="14"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The phone number used for your booking
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Search className="w-4 h-4 mr-2" />
                        Find My Booking
                      </div>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600">
                    Need help? Contact us at{' '}
                    <a href="tel:+15144374816" className="text-blue-600 hover:text-blue-700 font-medium">
                      (514) 437-4816
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Booking Details */}
            <div className="mb-8">
              <button
                onClick={() => {
                  setBooking(null);
                  setSearchData({ confirmationCode: '', phone: '' });
                  setError('');
                }}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Search Another Booking
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Your Booking Details
                </h2>
                <p className="text-gray-600">
                  Confirmation #{booking.confirmationCode}
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Status Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
                  
                  {(() => {
                    const statusInfo = getStatusInfo(booking.status);
                    return (
                      <div className={`p-4 rounded-lg ${statusInfo.color.split(' ')[1]} border-2 border-current border-opacity-20`}>
                        <div className="flex items-center mb-2">
                          <div className={statusInfo.color.split(' ')[0]}>
                            {statusInfo.icon}
                          </div>
                          <span className={`ml-2 font-semibold ${statusInfo.color.split(' ')[0]}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className={`text-sm ${statusInfo.color.split(' ')[0]} opacity-80`}>
                          {statusInfo.description}
                        </p>
                      </div>
                    );
                  })()}

                  {booking.status === 'CONFIRMED' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">📞 Next Steps</p>
                      <p className="text-xs text-blue-700 mt-1">
                        We'll call you 24 hours before your appointment to confirm details and provide an estimated arrival time.
                      </p>
                    </div>
                  )}

                  {(booking.status === 'EN_ROUTE' || booking.status === 'STARTED' || booking.status === 'IN_PROGRESS') && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium">🚧 Work in Progress</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Our professional team is currently working on your vehicle. We'll update you when complete.
                      </p>
                    </div>
                  )}

                  {booking.status === 'COMPLETED' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">✨ All Done!</p>
                      <p className="text-xs text-green-700 mt-1">
                        Thank you for choosing Prime Detailing! We hope you love the results.
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                  <div className="space-y-3">
                    <a
                      href="tel:+15144374816"
                      className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-900">(514) 437-4816</p>
                        <p className="text-xs text-blue-600">Call us directly</p>
                      </div>
                    </a>
                    <a
                      href="mailto:info@primedetailing.ca"
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">info@primedetailing.ca</p>
                        <p className="text-xs text-gray-600">Send us an email</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Appointment Details</h3>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        Customer Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const customer = getCustomerInfo(booking);
                          return (
                            <>
                              <p><span className="font-medium">Name:</span> {customer.firstName} {customer.lastName}</p>
                              <p><span className="font-medium">Email:</span> {customer.email}</p>
                              <p><span className="font-medium">Phone:</span> {customer.phoneNumber}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Appointment Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        Appointment Time
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Date:</span> {formatDate(booking.date)}</p>
                        <p><span className="font-medium">Time:</span> {formatTime(booking.time)}</p>
                        <p><span className="font-medium">Booked:</span> {new Date(booking.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                        Service Location
                      </h4>
                      <div className="text-sm">
                        {(() => {
                          const customer = getCustomerInfo(booking);
                          return (
                            <>
                              <p>{customer.address}</p>
                              <p>{customer.city}, {customer.postalCode}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Car className="w-4 h-4 mr-2 text-blue-600" />
                        Vehicle
                      </h4>
                      <div className="text-sm">
                        {(() => {
                          const vehicle = getVehicleInfo(booking);
                          return (
                            <>
                              <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                              <p className="text-gray-600 capitalize">{vehicle.type}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Services - FIXED */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                      Selected Services
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Try to use backend-resolved services first, otherwise resolve locally
                            const serviceNames = booking.resolvedServices && booking.resolvedServices.length > 0 
                              ? booking.resolvedServices 
                              : resolveServiceNames(booking.services);
                            
                            return serviceNames.map((service, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {service}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                      
                      {(() => {
                        // Try to use backend-resolved add-ons first, otherwise resolve locally
                        const addOnNames = booking.resolvedAddOns && booking.resolvedAddOns.length > 0 
                          ? booking.resolvedAddOns 
                          : resolveAddOnNames(booking.extras);
                        
                        if (addOnNames.length > 0) {
                          return (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Package className="w-4 h-4 mr-1" />
                                Add-ons:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {addOnNames.map((extra, index) => (
                                  <span
                                    key={index}
                                    className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                  >
                                    {extra}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {booking.specialInstructions && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {booking.specialInstructions}
                      </p>
                    </div>
                  )}

                  {/* Total Price */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Price:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${parseFloat(booking.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Book Another Service
              </Link>
              <Link
                to="/contact"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium text-center"
              >
                Contact Us
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BookingLookup;