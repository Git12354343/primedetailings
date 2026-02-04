// src/hooks/useTimeTracking.js
import { useState, useEffect } from 'react';

export const useTimeTracking = () => {
  const [timeTracking, setTimeTracking] = useState({});
  const [activeJob, setActiveJob] = useState(null);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedActiveJob = localStorage.getItem('activeJob');
    const savedTimeTracking = localStorage.getItem('timeTracking');
    
    if (savedActiveJob) {
      setActiveJob(JSON.parse(savedActiveJob));
    }
    if (savedTimeTracking) {
      setTimeTracking(JSON.parse(savedTimeTracking));
    }
  }, []);

  // Save time tracking to localStorage whenever it updates
  useEffect(() => {
    localStorage.setItem('timeTracking', JSON.stringify(timeTracking));
  }, [timeTracking]);

  // Save active job to localStorage whenever it updates
  useEffect(() => {
    if (activeJob) {
      localStorage.setItem('activeJob', JSON.stringify(activeJob));
    } else {
      localStorage.removeItem('activeJob');
    }
  }, [activeJob]);

  const startTimeTracking = (bookingId, booking) => {
    const now = new Date().toISOString();
    setTimeTracking(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        startTime: now,
        isActive: true
      }
    }));
    
    if (booking) {
      setActiveJob(booking);
    }
  };

  const stopTimeTracking = (bookingId) => {
    const now = new Date().toISOString();
    setTimeTracking(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        endTime: now,
        isActive: false
      }
    }));

    // Clear active job if this was the active one
    if (activeJob?.id === bookingId) {
      setActiveJob(null);
    }
  };

  const calculateWorkTime = (bookingId) => {
    const tracking = timeTracking[bookingId];
    if (!tracking?.startTime) return '0h 0m';
    
    const start = new Date(tracking.startTime);
    const end = tracking.endTime ? new Date(tracking.endTime) : new Date();
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getTotalWorkTimeToday = () => {
    const today = new Date().toISOString().split('T')[0];
    let totalMinutes = 0;

    Object.values(timeTracking).forEach(track => {
      if (track.startTime) {
        const startDate = new Date(track.startTime).toISOString().split('T')[0];
        if (startDate === today) {
          const start = new Date(track.startTime);
          const end = track.endTime ? new Date(track.endTime) : new Date();
          const diff = end - start;
          totalMinutes += Math.floor(diff / (1000 * 60));
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const clearAllTracking = () => {
    setTimeTracking({});
    setActiveJob(null);
    localStorage.removeItem('timeTracking');
    localStorage.removeItem('activeJob');
  };

  return {
    timeTracking,
    activeJob,
    startTimeTracking,
    stopTimeTracking,
    calculateWorkTime,
    getTotalWorkTimeToday,
    clearAllTracking
  };
};