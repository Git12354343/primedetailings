import React, { useState } from 'react';
import {
  User, Phone, Car, Wrench, Package, MapPin, Navigation, 
  MessageSquare, Timer, CheckCircle, AlertCircle, Clock, 
  StickyNote, Calendar, Route, Play, Camera, Activity, Loader2
} from 'lucide-react';

// Import the components we created
// import JobTimelineTracker from './JobTimelineTracker';
// import StartNavigationComponent from './StartNavigationComponent';

const ProfessionalJobCard = ({ 
  booking, 
  onStatusUpdate, 
  onEditNotes, 
  timeTracking, 
  calculateWorkTime, 
  isActive,
  onStartNavigation 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Enhanced status tracking with more granular states
  const getStatus = () => {
    // Map your existing statuses to enhanced timeline statuses
    const statusMap = {
      'CONFIRMED': 'CONFIRMED',
      'EN_ROUTE': 'EN_ROUTE', 
      'STARTED': 'STARTED',
      'IN_PROGRESS': 'IN_PROGRESS',
      'COMPLETED': 'COMPLETED'
    };
    
    return statusMap[booking.status] || 'CONFIRMED';
  };

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
      case 'EN_ROUTE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'STARTED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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
      case 'EN_ROUTE':
        return <Navigation className="w-4 h-4" />;
      case 'STARTED':
        return <Play className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Activity className="w-4 h-4" />;
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

  const handleGetDirections = () => {
    const address = `${booking.customer.address}, ${booking.customer.city}`;
    const encodedAddress = encodeURIComponent(address);
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Deep link format for mobile Google Maps
      const googleMapsDeepLink = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;
      
      // Try to open native app first
      window.location.href = googleMapsDeepLink;
      
      // Fallback to Waze after a short delay
      setTimeout(() => {
        window.open(wazeUrl, '_blank');
      }, 1000);
    } else {
      // Desktop - use standard Google Maps
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }

    // Trigger navigation callback
    if (onStartNavigation) {
      onStartNavigation(booking);
    }
  };

  const handleCallCustomer = () => {
    window.open(`tel:${booking.customer.phoneNumber}`, '_self');
  };

  const handleSendSMS = (message) => {
    const smsBody = encodeURIComponent(message);
    window.open(`sms:${booking.customer.phoneNumber}?body=${smsBody}`, '_self');
  };

  // Enhanced timeline component embedded in the card
  const TimelineProgress = () => {
    const timelineStages = [
      {
        key: 'assigned',
        label: 'Assigned',
        icon: User,
        status: 'CONFIRMED',
        timestamp: booking?.createdAt
      },
      {
        key: 'on_way',
        label: 'En Route',
        icon: Navigation,
        status: 'EN_ROUTE',
        timestamp: booking?.enRouteAt
      },
      {
        key: 'started',
        label: 'Started',
        icon: Play,
        status: 'STARTED',
        timestamp: booking?.startedAt
      },
      {
        key: 'in_progress',
        label: 'Working',
        icon: Activity,
        status: 'IN_PROGRESS',
        timestamp: timeTracking?.startTime
      },
      {
        key: 'completed',
        label: 'Done',
        icon: CheckCircle,
        status: 'COMPLETED',
        timestamp: timeTracking?.endTime || booking?.completedAt
      }
    ];

    const getCurrentStageIndex = () => {
      const statusMap = {
        'CONFIRMED': 0,
        'EN_ROUTE': 1,
        'STARTED': 2,
        'IN_PROGRESS': 3,
        'COMPLETED': 4
      };
      return statusMap[booking?.status] || 0;
    };

    const currentStageIndex = getCurrentStageIndex();

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return null;
      try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } catch (error) {
        return null;
      }
    };

    return (
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Timer className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">Progress</span>
          </div>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {showTimeline ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Mini progress bar */}
        <div className="relative mb-2">
          <div className="flex justify-between">
            {timelineStages.map((stage, index) => {
              const Icon = stage.icon;
              const completed = index < currentStageIndex;
              const current = index === currentStageIndex;
              const timestamp = formatTimestamp(stage.timestamp);

              return (
                <div key={stage.key} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                    completed 
                      ? 'bg-blue-600 text-white' 
                      : current
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {current && booking?.status !== 'COMPLETED' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  {showTimeline && (
                    <div className="mt-1 text-center">
                      <div className="text-xs font-medium text-gray-700">{stage.label}</div>
                      {timestamp && (
                        <div className="text-xs text-gray-500">{timestamp}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Progress line */}
          <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-300 -z-10">
            <div 
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(currentStageIndex / (timelineStages.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Current status indicator */}
        <div className="text-center">
          <span className="text-xs text-gray-600">
            {booking?.status === 'COMPLETED' ? 'Job completed!' : 
             `Currently: ${timelineStages[currentStageIndex]?.label || 'Assigned'}`}
          </span>
        </div>
      </div>
    );
  };

  return (
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

        {/* Timeline Progress */}
        <TimelineProgress />

        {/* Active Work Time Tracking */}
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
          {/* Phone and SMS Actions */}
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
          
          {/* Address with Enhanced Navigation */}
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
                Navigate
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
          {/* Services */}
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
          
          {/* Add-ons */}
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

      {/* Special Instructions */}
      {booking.specialInstructions && (
        <div className="p-4 border-b border-gray-100">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Special Instructions</span>
            </div>
            <p className="text-sm text-yellow-700 ml-6">{booking.specialInstructions}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="p-4 border-b border-gray-100">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <StickyNote className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Your Notes</span>
            </div>
            <p className="text-sm text-blue-700 ml-6 line-clamp-2">{booking.notes}</p>
          </div>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="p-4">
        <div className="space-y-2">
          {booking.status === 'CONFIRMED' && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleGetDirections();
                  handleStatusChange('EN_ROUTE');
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Start Navigation & Go En Route
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendSMS("Hi! I'm on my way to your location for the detailing service. See you soon!")}
                  className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                >
                  <Route className="w-3 h-3 mr-1" />
                  Notify En Route
                </button>
                <button
                  onClick={() => handleStatusChange('STARTED')}
                  disabled={isUpdating}
                  className="flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs disabled:opacity-50"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start Job
                </button>
              </div>
            </div>
          )}

          {booking.status === 'EN_ROUTE' && (
            <div className="space-y-2">
              <button
                onClick={() => handleStatusChange('STARTED')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                {isUpdating ? 'Starting...' : 'Arrived - Start Job'}
              </button>
              <button
                onClick={() => handleSendSMS("I've arrived at your location and will begin the detailing service shortly.")}
                className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Notify Arrival
              </button>
            </div>
          )}

          {(booking.status === 'STARTED' || booking.status === 'IN_PROGRESS') && (
            <div className="space-y-2">
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isUpdating ? 'Completing...' : 'Complete Job'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  Before Photo
                </button>
                <button
                  onClick={() => handleSendSMS("Work is progressing well on your vehicle. Will update you when complete!")}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Progress Update
                </button>
              </div>
            </div>
          )}
          
          {booking.status === 'COMPLETED' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center py-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Job Completed Successfully
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendSMS("Your vehicle detailing is complete! Thank you for choosing Prime Detailing.")}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Completion SMS
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
  );
};

export default ProfessionalJobCard;