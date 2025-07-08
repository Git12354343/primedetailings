// src/components/DashboardJobCard.jsx
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Phone, 
  Car, 
  CheckCircle, 
  AlertCircle, 
  User,
  Wrench,
  Package
} from 'lucide-react';

const DashboardJobCard = ({ booking, onStatusUpdate }) => {
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
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusColor(booking.status)}`}>
          {getStatusIcon(booking.status)}
          <span className="ml-1">{booking.status.replace('_', ' ')}</span>
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
          {booking.services.map((service, index) => (
            <span
              key={index}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1"
            >
              {service}
            </span>
          ))}
        </div>
        
        {/* Extras */}
        {booking.extras && booking.extras.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center mb-2">
              <Package className="w-4 h-4 mr-2 text-green-600" />
              <span className="font-medium text-gray-900">Add-ons</span>
            </div>
            <div className="space-y-1">
              {booking.extras.map((extra, index) => (
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

export default DashboardJobCard;