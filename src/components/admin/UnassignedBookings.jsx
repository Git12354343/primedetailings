// src/components/admin/UnassignedBookings.jsx
import React, { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import BookingCard from './BookingCard';

const UnassignedBookings = ({ 
  bookings, 
  detailers, 
  onRefresh, 
  availableServices = [], 
  availableAddOns = [] 
}) => {
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
      devError.error('Error assigning booking:', err);
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
      devError.error('Error auto-assigning booking:', err);
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg mb-1">Unassigned Bookings</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} need assignment
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-xl w-48"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
          >
            <option value="ALL" style={{ background: '#1a1a1a' }}>All</option>
            <option value="PENDING" style={{ background: '#1a1a1a' }}>Pending</option>
            <option value="CONFIRMED" style={{ background: '#1a1a1a' }}>Confirmed</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <CheckCircle className="w-10 h-10 mb-3" style={{ color: 'rgba(52,211,153,0.5)' }} />
            <h3 className="text-white font-bold mb-1">All caught up!</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No unassigned bookings right now.</p>
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
              availableServices={availableServices}
              availableAddOns={availableAddOns}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UnassignedBookings;