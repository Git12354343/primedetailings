// src/hooks/useJobManagement.js
import { useState, useEffect } from 'react';

export const useJobManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const updateBookingStatus = async (bookingId, newStatus) => {
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
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
              : booking
          )
        );
        return { success: true };
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: error.message };
    }
  };

  const updateBookingNotes = async (bookingId, notes) => {
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
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, notes: notes, updatedAt: new Date().toISOString() }
              : booking
          )
        );
        return { success: true };
      } else {
        throw new Error(data.message || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      return { success: false, error: error.message };
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    updateBookingStatus,
    updateBookingNotes
  };
};