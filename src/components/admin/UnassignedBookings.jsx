// src/components/admin/UnassignedBookings.jsx
import React, { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import BookingCard from './BookingCard';

const UnassignedBookings = ({ bookings, detailers, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigningBooking, setAssigningBooking] = useState(null);
  
  const { success, error } = useNotifications();

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
        success(`Booking assigned successfully to ${data.booking.detailerName}`);
        onRefresh();
      } else {
        error(data.message || 'Failed to assign booking');
      }
    } catch (err) {
      console.error('Error assigning booking:', err);
      error('Network error. Please try again.');
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
        success(`Booking auto-assigned to ${data.booking.detailerName}`);
        onRefresh();
      } else {
        error(data.message || 'Auto-assignment failed');
      }
    } catch (err) {
      console.error('Error auto-assigning booking:', err);
      error('Network error. Please try again.');
    } finally {
      setAssigningBooking(null);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.phoneNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Unassigned Bookings</h2>
        
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
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredBookings.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No unassigned bookings at the moment.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              detailers={detailers}
              onAssign={handleAssignBooking}
              onAutoAssign={handleAutoAssign}
              isAssigning={assigningBooking === booking.id}
              showAssignActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UnassignedBookings;