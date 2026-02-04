import { useState, useEffect, useCallback } from 'react';

export const useJobTracking = (jobs = []) => {
  const [timeTracking, setTimeTracking] = useState({});
  const [activeJob, setActiveJob] = useState(null);

  // Load saved state from localStorage
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

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('timeTracking', JSON.stringify(timeTracking));
  }, [timeTracking]);

  useEffect(() => {
    if (activeJob) {
      localStorage.setItem('activeJob', JSON.stringify(activeJob));
    } else {
      localStorage.removeItem('activeJob');
    }
  }, [activeJob]);

  const startTimeTracking = useCallback((jobId) => {
    const now = new Date().toISOString();
    setTimeTracking(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        startTime: now,
        isActive: true
      }
    }));
    
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setActiveJob(job);
    }
  }, [jobs]);

  const stopTimeTracking = useCallback((jobId) => {
    const now = new Date().toISOString();
    setTimeTracking(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        endTime: now,
        isActive: false
      }
    }));

    if (activeJob?.id === jobId) {
      setActiveJob(null);
    }
  }, [activeJob]);

  const calculateWorkTime = useCallback((jobId) => {
    const tracking = timeTracking[jobId];
    if (!tracking?.startTime) return '0h 0m';
    
    const start = new Date(tracking.startTime);
    const end = tracking.endTime ? new Date(tracking.endTime) : new Date();
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }, [timeTracking]);

  return {
    timeTracking,
    activeJob,
    startTimeTracking,
    stopTimeTracking,
    calculateWorkTime
  };
};