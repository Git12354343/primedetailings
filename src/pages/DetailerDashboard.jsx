// src/pages/DetailerDashboard.jsx - Complete with Confirmations
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
  X,
  Phone,
  Car,
  Package,
  Wrench,
  MapPin,
  Navigation,
  Play,
  Pause,
  Square,
  Camera,
  MessageSquare,
  Timer,
  DollarSign,
  Route,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type = 'default',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requireHold = false,
  holdDuration = 3
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdComplete, setHoldComplete] = useState(false);

  useEffect(() => {
    let interval;
    if (isHolding && requireHold) {
      interval = setInterval(() => {
        setHoldProgress(prev => {
          const newProgress = prev + (100 / (holdDuration * 10));
          if (newProgress >= 100) {
            setHoldComplete(true);
            setIsHolding(false);
            setTimeout(() => {
              onConfirm();
              handleClose();
            }, 200);
            return 100;
          }
          return newProgress;
        });
      }, 100);
    } else {
      setHoldProgress(0);
      setHoldComplete(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, requireHold, holdDuration, onConfirm]);

  const handleClose = () => {
    setIsHolding(false);
    setHoldProgress(0);
    setHoldComplete(false);
    onClose();
  };

  const handleMouseDown = () => {
    if (requireHold) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    if (requireHold) {
      setIsHolding(false);
      if (!holdComplete) {
        setHoldProgress(0);
      }
    }
  };

  const handleSimpleConfirm = () => {
    if (!requireHold) {
      onConfirm();
      handleClose();
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'start':
        return {
          icon: <Clock className="w-6 h-6 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          progressColor: 'bg-yellow-600'
        };
      case 'complete':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          confirmBg: 'bg-green-600 hover:bg-green-700',
          progressColor: 'bg-green-600'
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-gray-600" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          confirmBg: 'bg-gray-600 hover:bg-gray-700',
          progressColor: 'bg-gray-600'
        };
    }
  };

  if (!isOpen) return null;

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className={`px-6 py-4 border-b ${styles.borderColor} ${styles.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {styles.icon}
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                {title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-white hover:bg-opacity-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-center mb-6">
            {message}
          </p>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
            
            {requireHold ? (
              <div className="flex-1 relative">
                <button
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchEnd={handleMouseUp}
                  className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors relative overflow-hidden ${styles.confirmBg} ${
                    holdComplete ? 'opacity-75' : ''
                  }`}
                  disabled={holdComplete}
                >
                  <div 
                    className={`absolute inset-0 ${styles.progressColor} opacity-30 transition-all duration-100 ease-out`}
                    style={{ width: `${holdProgress}%` }}
                  />
                  <span className="relative z-10">
                    {holdComplete ? 'Confirmed!' : isHolding ? 'Hold to confirm...' : `Hold ${confirmText}`}
                  </span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Hold button for {holdDuration} seconds to confirm
                </p>
              </div>
            ) : (
              <button
                onClick={handleSimpleConfirm}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${styles.confirmBg}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Professional Job Card Component
const ProfessionalJobCard = ({ 
  booking, 
  onStatusUpdate, 
  onEditNotes, 
  timeTracking, 
  calculateWorkTime, 
  isActive 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmation, setConfirmation] = useState({
    show: false,
    type: '',
    action: null,
    title: '',
    message: ''
  });

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

  const handleStatusChange = async (newStatus) => {
    if (booking.status === newStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(booking.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const showConfirmation = (type, newStatus, requireHold = false) => {
    let title, message;
    
    switch (newStatus) {
      case 'IN_PROGRESS':
        title = 'Start Job';
        message = `Are you ready to start working on ${booking.customer.firstName} ${booking.customer.lastName}'s ${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}?`;
        break;
      case 'COMPLETED':
        title = 'Complete Job';
        message = `Have you finished all services for ${booking.customer.firstName} ${booking.customer.lastName}? This action cannot be undone.`;
        break;
      default:
        title = 'Confirm Action';
        message = 'Are you sure you want to proceed?';
    }

    setConfirmation({
      show: true,
      type,
      action: () => handleStatusChange(newStatus),
      title,
      message,
      requireHold
    });
  };

  const closeConfirmation = () => {
    setConfirmation({
      show: false,
      type: '',
      action: null,
      title: '',
      message: ''
    });
  };

  const handleGetDirections = () => {
    const address = `${booking.customer.address}, ${booking.customer.city}`;
    const encodedAddress = encodeURIComponent(address);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;
      const googleMapsUrl = `https://maps.google.com/maps?q=${encodedAddress}`;
      
      window.open(wazeUrl, '_blank');
      setTimeout(() => {
        window.open(googleMapsUrl, '_blank');
      }, 1000);
    } else {
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  };

  const handleCallCustomer = () => {
    window.open(`tel:${booking.customer.phoneNumber}`, '_self');
  };

  const handleSendSMS = (message) => {
    const smsBody = encodeURIComponent(message);
    window.open(`sms:${booking.customer.phoneNumber}?body=${smsBody}`, '_self');
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
        isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}>
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                {booking.customer.firstName} {booking.customer.lastName}
              </h3>
              <p className="text-sm text-gray-500">#{booking.confirmationCode}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="ml-1">{booking.status.replace('_', ' ')}</span>
              </div>
              
              <button
                onClick={() => onEditNotes(booking)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Add Notes"
              >
                <StickyNote className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Time and Date */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatTime(booking.time)}</span>
            </div>
          </div>

          {/* Time Tracking */}
          {timeTracking && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Timer className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">Work Time</span>
                </div>
                <span className="text-sm font-bold text-blue-900">{calculateWorkTime()}</span>
              </div>
              {timeTracking.isActive && (
                <div className="mt-2 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-blue-700">Currently working...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Contact & Location */}
        <div className="p-4 border-b border-gray-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">{booking.customer.phoneNumber}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCallCustomer}
                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </button>
                <button
                  onClick={() => handleSendSMS("Hi! I'm your detailer from Prime Detailing. I'll be there soon!")}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  SMS
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium text-gray-900 text-sm">Service Location</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-6">
                    {booking.customer.address}
                  </p>
                  <p className="text-sm text-gray-600 ml-6">
                    {booking.customer.city}
                  </p>
                </div>
                <button
                  onClick={handleGetDirections}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium ml-3"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Directions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="p-4 border-b border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Car className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-medium text-gray-900 text-sm">Vehicle</span>
            </div>
            <p className="text-sm text-gray-700 ml-6">
              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
            </p>
            <p className="text-xs text-gray-500 ml-6 capitalize">{booking.vehicle.type}</p>
          </div>
        </div>

        {/* Services and Add-ons */}
        <div className="p-4 border-b border-gray-100">
          <div className="space-y-3">
            <div>
              <div className="flex items-center mb-2">
                <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium text-gray-900 text-sm">Services</span>
              </div>
              <div className="flex flex-wrap gap-1 ml-6">
                {booking.services && booking.services.length > 0 ? (
                  booking.services.map((service, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">No services listed</span>
                )}
              </div>
            </div>
            
            {booking.extras && booking.extras.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Package className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium text-gray-900 text-sm">Add-ons</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-6">
                  {booking.extras.map((extra, index) => (
                    <span
                      key={index}
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                    >
                      {extra}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4">
          <div className="space-y-2">
            {booking.status === 'CONFIRMED' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendSMS("Hi! I'm on my way to your location for the detailing service. See you soon!")}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Route className="w-4 h-4 mr-2" />
                  En Route
                </button>
                <button
                  onClick={() => showConfirmation('start', 'IN_PROGRESS', false)}
                  disabled={isUpdating}
                  className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Starting...' : 'Start Job'}
                </button>
              </div>
            )}
            
            {booking.status === 'IN_PROGRESS' && (
              <div className="space-y-2">
                <button
                  onClick={() => showConfirmation('complete', 'COMPLETED', true)}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Completing...' : 'Complete Job'}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendSMS("I've arrived and will begin the detailing service shortly.")}
                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Arrived
                  </button>
                  <button
                    className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    Photo
                  </button>
                </div>
              </div>
            )}
            
            {booking.status === 'COMPLETED' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center py-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Job Completed
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendSMS("Your vehicle detailing is complete! Thank you for choosing Prime Detailing.")}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Done SMS
                  </button>
                  <button
                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    After Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Job Value */}
          {booking.totalPrice && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Job Value:</span>
                <span className="text-lg font-bold text-green-600">
                  ${parseFloat(booking.totalPrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.show}
        onClose={closeConfirmation}
        onConfirm={confirmation.action}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        requireHold={confirmation.requireHold}
        holdDuration={3}
        confirmText={confirmation.type === 'complete' ? 'Complete Job' : 'Start Job'}
      />
    </>
  );
};

// Main Dashboard Component
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
            ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
            : booking
        ));

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prime Detailing</h1>
              <p className="text-sm text-gray-600">Professional Dashboard</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center bg-green-50 px-3 py-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm font-medium text-green-900">
                  Today: ${todaysEarnings.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                <span className="text-sm hidden sm:inline">Website</span>
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
                <span className="text-sm hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Active Job Banner */}
      {activeJob && (
        <div className="bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Timer className="w-5 h-5 mr-2" />
                <div>
                  <p className="font-medium">
                    Active Job: {activeJob.customer.firstName} {activeJob.customer.lastName}
                  </p>
                  <p className="text-sm text-blue-100">
                    Working for {calculateWorkTime(activeJob.id)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStatusUpdate(activeJob.id, 'COMPLETED')}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Complete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Jobs</p>
                <p className="text-xl font-semibold text-gray-900">{statusCounts.TOTAL}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-xl font-semibold text-gray-900">{statusCounts.CONFIRMED}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-orange-100">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-xl font-semibold text-gray-900">{statusCounts.IN_PROGRESS}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Done</p>
                <p className="text-xl font-semibold text-gray-900">{statusCounts.COMPLETED}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Today</p>
                <p className="text-xl font-semibold text-gray-900">${todaysEarnings.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        {todayBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Today's Schedule</h3>
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {todayBookings.length} {todayBookings.length === 1 ? 'job' : 'jobs'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {booking.time} - {booking.customer.firstName} {booking.customer.lastName}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.customer.address}, {booking.customer.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: `All (${statusCounts.TOTAL})` },
              { key: 'CONFIRMED', label: `Confirmed (${statusCounts.CONFIRMED})` },
              { key: 'IN_PROGRESS', label: `Active (${statusCounts.IN_PROGRESS})` },
              { key: 'COMPLETED', label: `Done (${statusCounts.COMPLETED})` }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
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

        {/* Job Cards */}
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
              />
            ))}
          </div>
        )}

        {/* Notes Modal */}
        {notesModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Job Notes - {notesModal.booking.customer.firstName} {notesModal.booking.customer.lastName}
                  </h3>
                  <button
                    onClick={() => setNotesModal({ show: false, booking: null })}
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
                    defaultValue={notesModal.booking?.notes || ''}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add private notes about this job..."
                    id="notes-textarea"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes are private and only visible to detailers
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setNotesModal({ show: false, booking: null })}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const notes = document.getElementById('notes-textarea').value;
                      handleUpdateNotes(notesModal.booking.id, notes);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DetailerDashboard;