// src/hooks/useAdminData.js
import { useState, useEffect, useCallback } from 'react';

export const useAdminData = (adminToken) => {
  const [unassignedBookings, setUnassignedBookings] = useState([]);
  const [allBookings,        setAllBookings]        = useState([]);
  const [activeDetailers,    setActiveDetailers]    = useState([]);
  const [services,           setServices]           = useState([]);
  const [addOns,             setAddOns]             = useState([]);
  const [packages,           setPackages]           = useState([]);
  const [isLoading,          setIsLoading]          = useState(true);
  const [error,              setError]              = useState('');

  // ── Authenticated fetch helper ─────────────────────────────────────────────
  const authFetch = useCallback(async (url, options = {}, retries = 3) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'X-Admin-Secret': adminToken } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 429) {
        if (retries > 0) {
          const delay = Math.pow(2, 3 - retries) * 1000;
          await new Promise(r => setTimeout(r, delay));
          return authFetch(url, options, retries - 1);
        }
        throw new Error('Rate limit exceeded. Please wait before refreshing.');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`HTTP ${response.status} for ${url}:`, errorText);
        throw new Error(`Server error (${response.status}): ${url.split('/').pop()}`);
      }

      return response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Is your backend running on port 3001?');
      }
      throw err;
    }
  }, [adminToken]);

  // ── Data validators ────────────────────────────────────────────────────────
  const validateBooking = useCallback((b) => ({
    id: b.id,
    confirmationCode: b.confirmationCode || 'Unknown',
    customer: {
      firstName:   b.customer?.firstName   || 'Unknown',
      lastName:    b.customer?.lastName    || '',
      phoneNumber: b.customer?.phoneNumber || 'Unknown',
      email:       b.customer?.email       || '',
      address:     b.customer?.address     || 'Unknown',
      city:        b.customer?.city        || '',
      postalCode:  b.customer?.postalCode  || '',
    },
    vehicle: {
      type:  b.vehicle?.type  || 'Unknown',
      make:  b.vehicle?.make  || 'Unknown',
      model: b.vehicle?.model || '',
      year:  b.vehicle?.year  || '',
    },
    services:           b.services           || '[]',
    extras:             b.extras             || '[]',
    date:               b.date,
    time:               b.time,
    status:             b.status,
    detailerId:         b.detailerId,
    detailer:           b.detailer,
    specialInstructions:b.specialInstructions,
    notes:              b.notes,
    totalPrice:         b.totalPrice,
    enRouteAt:          b.enRouteAt,
    startedAt:          b.startedAt,
    arrivedAt:          b.arrivedAt,
    completedAt:        b.completedAt,
    estimatedDuration:  b.estimatedDuration,
    createdAt:          b.createdAt,
    updatedAt:          b.updatedAt,
  }), []);

  // ── Individual fetchers ────────────────────────────────────────────────────
  const fetchUnassignedBookings = useCallback(async () => {
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/admin/unassigned-bookings`);
      if (data.success) setUnassignedBookings(data.bookings.map(validateBooking));
    } catch (e) {
      console.error('fetchUnassignedBookings:', e.message);
      setUnassignedBookings([]);
    }
  }, [authFetch, validateBooking]);

  const fetchAllBookings = useCallback(async () => {
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/admin/all-bookings`);
      if (data.success) setAllBookings(data.bookings.map(validateBooking));
    } catch (e) {
      console.error('fetchAllBookings:', e.message);
      setAllBookings([]);
    }
  }, [authFetch, validateBooking]);

  const fetchActiveDetailers = useCallback(async () => {
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/admin/active-detailers`);
      if (data.success) setActiveDetailers(data.detailers);
    } catch (e) {
      console.error('fetchActiveDetailers:', e.message);
      setActiveDetailers([]);
    }
  }, [authFetch]);

  const fetchServices = useCallback(async () => {
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/services`);
      if (data.success) setServices(data.services);
    } catch (e) {
      console.error('fetchServices:', e.message);
      setServices([]);
    }
  }, [authFetch]);

  const fetchAddOns = useCallback(async () => {
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/services/addons`);
      if (data.success) setAddOns(data.addOns);
    } catch (e) {
      console.error('fetchAddOns:', e.message);
      setAddOns([]);
    }
  }, [authFetch]);

  const fetchPackages = useCallback(async () => {
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/packages`);
      if (data.success) setPackages(data.packages);
    } catch {
      setPackages([]);
    }
  }, [authFetch]);

  // ── Refresh all ────────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    setError('');
    const results = await Promise.allSettled([
      fetchUnassignedBookings(),
      fetchActiveDetailers(),
      fetchAllBookings(),
      fetchServices(),
      fetchAddOns(),
      fetchPackages(),
    ]);

    const failed = results
      .map((r, i) => r.status === 'rejected' ? ['unassigned', 'detailers', 'all-bookings', 'services', 'addons', 'packages'][i] : null)
      .filter(Boolean);

    if (failed.length > 0) {
      setError(`Some data failed to load: ${failed.join(', ')}. Check your backend server.`);
    }
  }, [fetchUnassignedBookings, fetchActiveDetailers, fetchAllBookings, fetchServices, fetchAddOns, fetchPackages]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adminToken) return;
    setIsLoading(true);
    refreshData().finally(() => setIsLoading(false));
  }, [adminToken, refreshData]);

  return {
    unassignedBookings, allBookings, activeDetailers,
    services, addOns, packages,
    isLoading, error,
    refreshData,
    setUnassignedBookings, setAllBookings, setActiveDetailers,
    authFetch,   // expose so child components can make authenticated requests
  };
};
