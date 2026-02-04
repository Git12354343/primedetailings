// src/components/admin/BookingCard.jsx
import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  DollarSign, 
  X, 
  Loader2 
} from 'lucide-react';
import { ServiceDisplay, ExtrasDisplay } from '../../utils/serviceUtils';

const BookingCard = ({ 
  booking, 
  detailers, 
  onAssign, 
  onAutoAssign, 
  isAssigning, 
  showAssignActions = true,
  availableServices = [],
  availableAddOns = []
}) => {
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
          {booking.customer.address && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {booking.customer.address}, {booking.customer.city}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Car className="w-4 h-4 mr-2" />
            {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
          </div>
          <div className="text-sm text-gray-600 capitalize">
            {booking.vehicle.type}
          </div>
          {booking.totalPrice && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              ${parseFloat(booking.totalPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Services:</h4>
        <ServiceDisplay 
          services={booking?.services}
          availableServices={availableServices}
        />
        <ExtrasDisplay 
          extras={booking?.extras}
          availableAddOns={availableAddOns}
          className="mt-2"
        />
      </div>

      {/* Special Instructions */}
      {booking.specialInstructions && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Special Instructions:</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {booking.specialInstructions}
          </p>
        </div>
      )}

      {/* Assignment Actions - Only show for unassigned bookings */}
      {showAssignActions && (
        <div className="border-t pt-4">
          {!showAssignDropdown ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAutoAssign(booking.id)}
                disabled={isAssigning}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Auto Assign'
                )}
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
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign'
                  )}
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

export default BookingCard;