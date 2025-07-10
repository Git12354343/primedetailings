// src/hooks/useAdminData.js - Improved version with graceful error handling
import { useState, useEffect, useCallback } from 'react';

export const useAdminData = () => {
  const [unassignedBookings, setUnassignedBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [activeDetailers, setActiveDetailers] = useState([]);
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Enhanced fetch with rate limit handling and better error messages
  const fetchWithRateLimit = useCallback(async (url, retries = 3) => {
    try {
      console.log(`Fetching: ${url}`);
      const response = await fetch(url);
      
      if (response.status === 429) {
        if (retries > 0) {
          const delay = Math.pow(2, 3 - retries) * 1000;
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRateLimit(url, retries - 1);
        } else {
          throw new Error('Rate limit exceeded. Please wait before refreshing.');
        }
      }
      
      if (!response.ok) {
        // More detailed error messages
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`HTTP ${response.status} for ${url}:`, errorText);
        throw new Error(`Server error (${response.status}): ${url.split('/').pop()}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched: ${url}`);
      return data;
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        throw error;
      }
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server. Is your backend running on port 3001?`);
      }
      
      console.error(`❌ Error fetching ${url}:`, error);
      throw new Error(`Failed to fetch ${url.split('/').pop()}: ${error.message}`);
    }
  }, []);

  // Format booking data to match schema
  const formatBookingData = useCallback((booking) => ({
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    customer: {
      firstName: booking.firstName,
      lastName: booking.lastName,
      phoneNumber: booking.phoneNumber,
      email: booking.email,
      address: booking.address,
      city: booking.city,
      postalCode: booking.postalCode
    },
    vehicle: {
      type: booking.vehicleType,
      make: booking.make,
      model: booking.model,
      year: booking.year
    },
    services: booking.services,
    extras: booking.extras,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    detailerId: booking.detailerId,
    detailer: booking.detailer,
    specialInstructions: booking.specialInstructions,
    notes: booking.notes,
    totalPrice: booking.totalPrice,
    enRouteAt: booking.enRouteAt,
    startedAt: booking.startedAt,
    arrivedAt: booking.arrivedAt,
    completedAt: booking.completedAt,
    estimatedDuration: booking.estimatedDuration,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  }), []);

  // Fetch functions with individual error handling
  const fetchUnassignedBookings = useCallback(async () => {
    try {
      const data = await fetchWithRateLimit(`${import.meta.env.VITE_API_URL}/admin/unassigned-bookings`);
      if (data.success) {
        setUnassignedBookings(data.bookings.map(formatBookingData));
      } else {
        console.warn('Unassigned bookings API returned success: false');
        setUnassignedBookings([]); // Set empty array instead of failing
      }
    } catch (error) {
      console.error('Error fetching unassigned bookings:', error);
      setUnassignedBookings([]); // Set empty array to allow app to continue
    }
  }, [fetchWithRateLimit, formatBookingData]);

  const fetchAllBookings = useCallback(async () => {
    try {
      const data = await fetchWithRateLimit(`${import.meta.env.VITE_API_URL}/admin/all-bookings`);
      if (data.success) {
        setAllBookings(data.bookings.map(formatBookingData));
      } else {
        console.warn('All bookings API returned success: false');
        setAllBookings([]);
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      setAllBookings([]);
    }
  }, [fetchWithRateLimit, formatBookingData]);

  const fetchActiveDetailers = useCallback(async () => {
    try {
      const data = await fetchWithRateLimit(`${import.meta.env.VITE_API_URL}/admin/active-detailers`);
      if (data.success) {
        setActiveDetailers(data.detailers);
      } else {
        console.warn('Active detailers API returned success: false');
        setActiveDetailers([]);
      }
    } catch (error) {
      console.error('Error fetching active detailers:', error);
      setActiveDetailers([]);
    }
  }, [fetchWithRateLimit]);

  const fetchServices = useCallback(async () => {
    try {
      const data = await fetchWithRateLimit(`${import.meta.env.VITE_API_URL}/services`);
      if (data.success) {
        setServices(data.services);
      } else {
        console.warn('Services API returned success: false');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  }, [fetchWithRateLimit]);

  const fetchAddOns = useCallback(async () => {
    try {
      const data = await fetchWithRateLimit(`${import.meta.env.VITE_API_URL}/services/addons`);
      if (data.success) {
        setAddOns(data.addOns);
      } else {
        console.warn('Add-ons API returned success: false');
        setAddOns([]);
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      setAddOns([]);
    }
  }, [fetchWithRateLimit]);

  // Refresh all data with better error aggregation
  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing admin data...');
    setError('');
    
    const errors = [];
    
    try {
      // Try to fetch all data, but don't fail completely if some endpoints are down
      const results = await Promise.allSettled([
        fetchUnassignedBookings(),
        new Promise(resolve => setTimeout(resolve, 200)),
        fetchActiveDetailers(),
        new Promise(resolve => setTimeout(resolve, 200)),
        fetchAllBookings(),
        new Promise(resolve => setTimeout(resolve, 200)),
        fetchServices(),
        new Promise(resolve => setTimeout(resolve, 200)),
        fetchAddOns()
      ]);

      // Check for rejected promises (but don't fail completely)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = ['unassigned-bookings', '', 'active-detailers', '', 'all-bookings', '', 'services', '', 'addons'];
          if (endpoints[index]) {
            errors.push(endpoints[index]);
          }
        }
      });

      if (errors.length > 0) {
        setError(`Some endpoints failed: ${errors.join(', ')}. Check if your backend server is running.`);
      } else {
        console.log('✅ All admin data refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Critical error during data refresh:', error);
      setError('Failed to connect to server. Please check if your backend is running on port 3001.');
    }
  }, [fetchUnassignedBookings, fetchActiveDetailers, fetchAllBookings, fetchServices, fetchAddOns]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log('🚀 Loading initial admin data...');
      setIsLoading(true);
      try {
        await refreshData();
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
        setError('Failed to load initial data. Please check your backend server.');
      } finally {
        setIsLoading(false);
        console.log('✅ Initial data load completed');
      }
    };

    fetchInitialData();
  }, [refreshData]);

  return {
    unassignedBookings,
    allBookings,
    activeDetailers,
    services,
    addOns,
    isLoading,
    error,
    refreshData,
    setUnassignedBookings,
    setAllBookings,
    setActiveDetailers
  };
};