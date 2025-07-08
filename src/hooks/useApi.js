// src/hooks/useApi.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNotifications } from '../components/NotificationSystem';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// HTTP methods
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};

// Default API options
const DEFAULT_OPTIONS = {
  headers: {
    'Content-Type': 'application/json'
  }
};

// Enhanced fetch wrapper with better error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...options.headers
    }
  };

  // Add auth token if available
  const token = localStorage.getItem('detailerToken') || localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Network or parsing errors
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};

// Main useApi hook
export const useApi = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);
  const { notifyApiError } = useNotifications?.() || {};

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute API request
  const execute = useCallback(async (endpoint, requestOptions = {}) => {
    cleanup(); // Cancel previous request
    
    setLoading(true);
    setError(null);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const config = {
        ...requestOptions,
        signal: abortControllerRef.current.signal
      };

      const result = await apiRequest(endpoint, config);
      setData(result);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return null;
      }
      
      setError(err.message);
      
      // Show notification if enabled
      if (options.showErrorNotification !== false && notifyApiError) {
        notifyApiError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cleanup, options.showErrorNotification, notifyApiError]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
};

// Specific API hooks for common operations

// Bookings API
export const useBookingsApi = () => {
  const api = useApi();
  const { notifyBookingSuccess, notifyApiError } = useNotifications?.() || {};

  const createBooking = useCallback(async (bookingData) => {
    try {
      const result = await api.execute('/bookings/initiate', {
        method: HTTP_METHODS.POST,
        body: JSON.stringify(bookingData)
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [api]);

  const verifyBooking = useCallback(async (verificationData) => {
    try {
      const result = await api.execute('/bookings/verify', {
        method: HTTP_METHODS.POST,
        body: JSON.stringify(verificationData)
      });
      
      if (result.success && notifyBookingSuccess) {
        notifyBookingSuccess(result.booking.confirmationCode);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [api, notifyBookingSuccess]);

  const getAssignedBookings = useCallback(async () => {
    return api.execute('/bookings/assigned');
  }, [api]);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    return api.execute(`/bookings/${bookingId}/status`, {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify({ status })
    });
  }, [api]);

  const completeBooking = useCallback(async (bookingId) => {
    return api.execute(`/bookings/${bookingId}/complete`, {
      method: HTTP_METHODS.PATCH
    });
  }, [api]);

  return {
    ...api,
    createBooking,
    verifyBooking,
    getAssignedBookings,
    updateBookingStatus,
    completeBooking
  };
};

// Admin API
export const useAdminApi = () => {
  const api = useApi();
  const { notifyAssignmentSuccess } = useNotifications?.() || {};

  const getUnassignedBookings = useCallback(async () => {
    return api.execute('/admin/unassigned-bookings');
  }, [api]);

  const getAllBookings = useCallback(async () => {
    return api.execute('/admin/all-bookings');
  }, [api]);

  const getActiveDetailers = useCallback(async () => {
    return api.execute('/admin/active-detailers');
  }, [api]);

  const assignBooking = useCallback(async (bookingId, detailerId) => {
    try {
      const result = await api.execute('/admin/assign-detailer', {
        method: HTTP_METHODS.POST,
        body: JSON.stringify({ bookingId, detailerId })
      });
      
      if (result.success && notifyAssignmentSuccess) {
        notifyAssignmentSuccess(result.booking.detailerName);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [api, notifyAssignmentSuccess]);

  const autoAssignBooking = useCallback(async (bookingId) => {
    try {
      const result = await api.execute('/admin/auto-assign', {
        method: HTTP_METHODS.POST,
        body: JSON.stringify({ bookingId })
      });
      
      if (result.success && notifyAssignmentSuccess) {
        notifyAssignmentSuccess(result.booking.detailerName);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [api, notifyAssignmentSuccess]);

  return {
    ...api,
    getUnassignedBookings,
    getAllBookings,
    getActiveDetailers,
    assignBooking,
    autoAssignBooking
  };
};

// Auth API
export const useAuthApi = () => {
  const api = useApi();

  const login = useCallback(async (credentials) => {
    const result = await api.execute('/auth/login', {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(credentials)
    });
    
    if (result.success) {
      localStorage.setItem('detailerToken', result.token);
      localStorage.setItem('detailerInfo', JSON.stringify(result.detailer));
    }
    
    return result;
  }, [api]);

  const verifyToken = useCallback(async () => {
    return api.execute('/auth/verify');
  }, [api]);

  const logout = useCallback(() => {
    localStorage.removeItem('detailerToken');
    localStorage.removeItem('detailerInfo');
    localStorage.removeItem('adminAuthenticated');
  }, []);

  return {
    ...api,
    login,
    verifyToken,
    logout
  };
};

// Contact API
export const useContactApi = () => {
  const api = useApi();

  const submitContact = useCallback(async (contactData) => {
    return api.execute('/contact', {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(contactData)
    });
  }, [api]);

  return {
    ...api,
    submitContact
  };
};

// Retry hook for failed requests
export const useRetryableApi = (maxRetries = 3, retryDelay = 1000) => {
  const api = useApi();
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (endpoint, options = {}) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        const result = await api.execute(endpoint, options);
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  }, [api, maxRetries, retryDelay]);

  return {
    ...api,
    executeWithRetry,
    retryCount,
    maxRetries
  };
};

// Polling hook for real-time updates
export const usePollingApi = (endpoint, interval = 30000, options = {}) => {
  const api = useApi();
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling

    setIsPolling(true);
    
    const poll = async () => {
      try {
        await api.execute(endpoint, options);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial fetch
    poll();
    
    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [api, endpoint, options, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    return stopPolling; // Cleanup on unmount
  }, [stopPolling]);

  return {
    ...api,
    isPolling,
    startPolling,
    stopPolling
  };
};

export default useApi;