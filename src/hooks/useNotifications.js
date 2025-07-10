import { useContext } from 'react';
import { NotificationContext } from '../components/notifications/NotificationProvider';

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  const { addNotification, removeNotification, notifications, settings } = context;

  const success = (message, options = {}) => {
    addNotification({
      type: 'success',
      message,
      duration: 4000,
      ...options
    });
  };

  const error = (message, options = {}) => {
    addNotification({
      type: 'error',
      message,
      duration: 6000,
      ...options
    });
  };

  const warning = (message, options = {}) => {
    addNotification({
      type: 'warning',
      message,
      duration: 5000,
      ...options
    });
  };

  const info = (message, options = {}) => {
    addNotification({
      type: 'info',
      message,
      duration: 4000,
      ...options
    });
  };

  const jobAssignment = (job, options = {}) => {
    addNotification({
      type: 'assignment',
      title: '🚗 New Job Assigned!',
      message: `You've been assigned a job for ${job.customer.firstName} ${job.customer.lastName}`,
      metadata: {
        customerName: `${job.customer.firstName} ${job.customer.lastName}`,
        address: `${job.customer.address}, ${job.customer.city}`,
        time: job.time
      },
      persistent: true,
      ...options
    });
  };

  return {
    success,
    error,
    warning,
    info,
    jobAssignment,
    notifications,
    settings
  };
};