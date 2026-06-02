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
  Home,
  Droplet,
  X,
  Loader2
} from 'lucide-react';
import { ServiceDisplay, ExtrasDisplay } from '../../utils/serviceUtils';

const STATUS_STYLES = {
  PENDING:     'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  CONFIRMED:   'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  IN_PROGRESS: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  COMPLETED:   'bg-green-500/15 text-green-300 border border-green-500/30',
  CANCELED:    'bg-red-500/15 text-red-300 border border-red-500/30',
};

const CONDITION_LABELS = { LIGHT: 'Light', MODERATE: 'Moderate', HEAVY: 'Heavy' };

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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [h, minutes] = timeString.split(':');
    const hours = parseInt(h, 10);
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

  const assignedDetailer = booking.detailerId
    ? detailers.find(d => d.id === booking.detailerId)
    : null;

  const vehicleLine = [booking.vehicle.year, booking.vehicle.make, booking.vehicle.model]
    .filter(v => v && v !== 'Unknown' && v !== null)
    .join(' ') || booking.vehicle.type;

  const statusClass = STATUS_STYLES[booking.status] || 'bg-gray-700 text-gray-300 border border-gray-600';

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-cyan-400" />
            {booking.customer.firstName} {booking.customer.lastName}
          </h3>
          <p className="text-sm text-gray-500">#{booking.confirmationCode}</p>
          {assignedDetailer && (
            <p className="text-sm text-green-400 font-medium mt-1">
              Assigned to: {assignedDetailer.name}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
          {booking.status.replace('_', ' ')}
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-300">
            <Phone className="w-4 h-4 mr-2 text-gray-500" />
            {booking.customer.phoneNumber}
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            {formatDate(booking.date)}
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <Clock className="w-4 h-4 mr-2 text-gray-500" />
            {formatTime(booking.time)}
          </div>
          {booking.customer.address && (
            <div className="flex items-center text-sm text-gray-300">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              {booking.customer.address}, {booking.customer.city}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-300">
            <Car className="w-4 h-4 mr-2 text-gray-500" />
            {vehicleLine}
          </div>
          <div className="text-sm text-gray-400 capitalize">
            {booking.vehicle.type}
            {booking.vehicle.condition && CONDITION_LABELS[booking.vehicle.condition]
              ? ` · ${CONDITION_LABELS[booking.vehicle.condition]} condition`
              : ''}
          </div>
          {booking.propertyType && (
            <div className="flex items-center text-sm text-gray-300">
              <Home className="w-4 h-4 mr-2 text-gray-500" />
              {booking.propertyType}
            </div>
          )}
          {booking.hasWaterPower !== undefined && booking.hasWaterPower !== null && (
            <div className="flex items-center text-sm">
              <Droplet className="w-4 h-4 mr-2 text-gray-500" />
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                booking.hasWaterPower
                  ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {booking.hasWaterPower ? 'Water & power: Yes' : 'Water & power: No'}
              </span>
            </div>
          )}
          {booking.totalPrice && (
            <div className="flex items-center text-sm text-gray-300">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
              ${parseFloat(booking.totalPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-white mb-2">Services:</h4>
        <ServiceDisplay services={booking?.services} availableServices={availableServices} />
        <ExtrasDisplay extras={booking?.extras} availableAddOns={availableAddOns} className="mt-2" />
      </div>

      {/* Special Instructions */}
      {booking.specialInstructions && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-white mb-1">Special Instructions:</h4>
          <p className="text-sm text-gray-300 bg-white/5 border border-white/10 p-2 rounded">
            {booking.specialInstructions}
          </p>
        </div>
      )}

      {/* Assignment Actions - Only show for unassigned bookings */}
      {showAssignActions && (
        <div className="border-t border-white/10 pt-4">
          {!showAssignDropdown ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAutoAssign(booking.id)}
                disabled={isAssigning}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isAssigning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</>
                ) : 'Auto Assign'}
              </button>
              <button
                onClick={() => setShowAssignDropdown(true)}
                disabled={isAssigning}
                className="flex-1 bg-cyan-500 text-[#0b0f1a] py-2 px-4 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                Manual Assign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Select Detailer:</label>
                <button
                  onClick={() => { setShowAssignDropdown(false); setSelectedDetailer(''); }}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <select
                value={selectedDetailer}
                onChange={(e) => setSelectedDetailer(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/15 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="" style={{ background: '#111827' }}>Choose a detailer...</option>
                {detailers.map((detailer) => (
                  <option key={detailer.id} value={detailer.id} style={{ background: '#111827' }}>
                    {detailer.name} ({detailer.activeBookings} active jobs)
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleManualAssign}
                  disabled={!selectedDetailer || isAssigning}
                  className="flex-1 bg-cyan-500 text-[#0b0f1a] py-2 px-4 rounded-lg hover:bg-cyan-400 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center justify-center"
                >
                  {isAssigning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</>
                  ) : 'Assign'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status info for assigned bookings */}
      {!showAssignActions && booking.status === 'COMPLETED' && (
        <div className="border-t border-white/10 pt-4">
          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
            <p className="text-sm text-green-300 font-medium">✅ Job Completed</p>
            <p className="text-xs text-green-400/80">This booking has been finished by the detailer.</p>
          </div>
        </div>
      )}

      {!showAssignActions && booking.status === 'IN_PROGRESS' && (
        <div className="border-t border-white/10 pt-4">
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
            <p className="text-sm text-orange-300 font-medium">🚧 Job In Progress</p>
            <p className="text-xs text-orange-400/80">The detailer is currently working on this booking.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
