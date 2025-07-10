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
// Enhanced fetch wrapper with better error handling and debugging
const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  console.log('🌐 Making API request:', {
    url,
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body ? JSON.parse(options.body) : 'No body'
  });
  
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
    console.log('🔑 Added auth token to request');
  }

  try {
    const response = await fetch(url, config);
    
    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('📄 Response data:', data);
    } else {
      data = await response.text();
      console.log('📄 Response text:', data);
    }

    if (!response.ok) {
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      // Create a detailed error message
      let errorMessage = '';
      
      if (typeof data === 'object' && data.error) {
        errorMessage = data.error;
      } else if (typeof data === 'object' && data.message) {
        errorMessage = data.message;
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = { 
        status: response.status, 
        data: data,
        statusText: response.statusText 
      };
      
      throw error;
    }

    console.log('✅ API request successful');
    return data;

  } catch (error) {
    console.error('❌ API request failed:', error);
    
    // Network or parsing errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error detected');
      const networkError = new Error('Network error. Please check your connection and try again.');
      networkError.isNetworkError = true;
      throw networkError;
    }

    // JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('📄 JSON parsing error detected');
      const parseError = new Error('Server returned invalid response format.');
      parseError.isParseError = true;
      throw parseError;
    }
    
    // Re-throw with additional context
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
// Enhanced useBookingsApi with better debugging and error handling
export const useBookingsApi = () => {
  const api = useApi();
  const { notifyBookingSuccess, notifyApiError, error: notifyError } = useNotifications?.() || {};

  const createBooking = useCallback(async (bookingData) => {
    try {
      console.log('🚀 useBookingsApi: Creating booking with data:', JSON.stringify(bookingData, null, 2));
      
      // Frontend validation before sending
      const requiredFields = {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        address: bookingData.address,
        city: bookingData.city,
        postalCode: bookingData.postalCode,
        vehicleType: bookingData.vehicleType,
        make: bookingData.make,
        model: bookingData.model,
        year: bookingData.year,
        services: bookingData.services,
        date: bookingData.date,
        time: bookingData.time
      };

      console.log('🔍 Frontend validation check:');
      for (const [field, value] of Object.entries(requiredFields)) {
        const isEmpty = value === null || value === undefined || value === '' || 
                       (Array.isArray(value) && value.length === 0);
        console.log(`${field}: ${isEmpty ? '❌ EMPTY' : '✅ OK'} - Value:`, value);
        
        if (isEmpty) {
          const error = `Please fill in the ${field} field`;
          console.error(`❌ Frontend validation failed: ${error}`);
          if (notifyError) notifyError(error);
          throw new Error(error);
        }
      }

      // Additional frontend validations
      if (!Array.isArray(bookingData.services) || bookingData.services.length === 0) {
        const error = 'Please select at least one service';
        console.error('❌ Services validation failed:', bookingData.services);
        if (notifyError) notifyError(error);
        throw new Error(error);
      }

      if (isNaN(bookingData.year) || bookingData.year < 1990) {
        const error = 'Please enter a valid vehicle year';
        console.error('❌ Year validation failed:', bookingData.year);
        if (notifyError) notifyError(error);
        throw new Error(error);
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingData.email)) {
        const error = 'Please enter a valid email address';
        console.error('❌ Email validation failed:', bookingData.email);
        if (notifyError) notifyError(error);
        throw new Error(error);
      }

      console.log('✅ Frontend validation passed, making API call');
      
      const result = await api.execute('/bookings/initiate', {
        method: HTTP_METHODS.POST,
        body: JSON.stringify(bookingData)
      });
      
      console.log('✅ API call successful:', result);
      return result;
      
    } catch (error) {
      console.error('❌ createBooking error:', error);
      
      // Don't show notification if we already showed it during validation
      if (!error.message.includes('Please fill in') && 
          !error.message.includes('Please select') && 
          !error.message.includes('Please enter')) {
        
        // Extract the actual error message from API response
        if (error.message.includes('HTTP 400:')) {
          const apiError = 'Please check your information and try again';
          if (notifyError) notifyError(apiError);
        }
      }
      
      throw error;
    }
  }, [api, notifyError]);

  const verifyBooking = useCallback(async (verificationData) => {
    try {
      console.log('🔑 useBookingsApi: Verifying booking:', verificationData);
      
      // Validate verification data
      if (!verificationData.bookingId || !verificationData.verificationCode) {
        const error = 'Booking ID and verification code are required';
        console.error('❌ Verification validation failed');
        if (notifyError) notifyError(error);
        throw new Error(error);
      }

      if (verificationData.verificationCode.length !== 6) {
        const error = 'Please enter a valid 6-digit verification code';
        console.error('❌ Verification code length validation failed');
        if (notifyError) notifyError(error);
        throw new Error(error);
      }
      
      const result = await api.execute('/bookings/verify', {
        method: HTTP_METHODS.POST,
        body: JSON.stringify(verificationData)
      });
      
      console.log('✅ Verification successful:', result);
      
      if (result.success && notifyBookingSuccess) {
        notifyBookingSuccess(result.booking.confirmationCode);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ verifyBooking error:', error);
      
      // Handle specific verification errors
      if (error.message.includes('Invalid verification code')) {
        // Error message already contains the attempts remaining info
        if (notifyError) notifyError(error.message);
      } else if (error.message.includes('expired')) {
        if (notifyError) notifyError('Verification code has expired. Please request a new one.');
      } else if (error.message.includes('Maximum verification attempts')) {
        if (notifyError) notifyError('Too many incorrect attempts. Please start over.');
      } else {
        if (notifyError) notifyError('Verification failed. Please try again.');
      }
      
      throw error;
    }
  }, [api, notifyBookingSuccess, notifyError]);

  const getAssignedBookings = useCallback(async () => {
    try {
      console.log('📋 useBookingsApi: Getting assigned bookings');
      return await api.execute('/bookings/assigned');
    } catch (error) {
      console.error('❌ getAssignedBookings error:', error);
      throw error;
    }
  }, [api]);

  const updateBookingStatus = useCallback(async (bookingId, status, notes = '') => {
    try {
      console.log('📝 useBookingsApi: Updating booking status:', { bookingId, status, notes });
      return await api.execute(`/bookings/${bookingId}/status`, {
        method: HTTP_METHODS.PATCH,
        body: JSON.stringify({ status, notes })
      });
    } catch (error) {
      console.error('❌ updateBookingStatus error:', error);
      throw error;
    }
  }, [api]);

  const completeBooking = useCallback(async (bookingId, notes = '') => {
    try {
      console.log('✅ useBookingsApi: Completing booking:', { bookingId, notes });
      return await api.execute(`/bookings/${bookingId}/complete`, {
        method: HTTP_METHODS.PATCH,
        body: JSON.stringify({ notes })
      });
    } catch (error) {
      console.error('❌ completeBooking error:', error);
      throw error;
    }
  }, [api]);

  const updateBookingNotes = useCallback(async (bookingId, notes) => {
    try {
      console.log('📝 useBookingsApi: Updating booking notes:', { bookingId, notes });
      return await api.execute(`/bookings/${bookingId}/notes`, {
        method: HTTP_METHODS.PATCH,
        body: JSON.stringify({ notes })
      });
    } catch (error) {
      console.error('❌ updateBookingNotes error:', error);
      throw error;
    }
  }, [api]);

  const getBookingByCode = useCallback(async (confirmationCode) => {
    try {
      console.log('🔍 useBookingsApi: Getting booking by code:', confirmationCode);
      return await api.execute(`/bookings/${confirmationCode}`);
    } catch (error) {
      console.error('❌ getBookingByCode error:', error);
      throw error;
    }
  }, [api]);

  return {
    ...api,
    createBooking,
    verifyBooking,
    getAssignedBookings,
    updateBookingStatus,
    completeBooking,
    updateBookingNotes,
    getBookingByCode
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