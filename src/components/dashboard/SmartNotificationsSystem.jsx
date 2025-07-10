import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

// Toast Notification Component
const ToastNotification = ({ 
  notification, 
  onDismiss, 
  onAction,
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after duration
    if (notification.autoDismiss !== false) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getNotificationStyles = () => {
    const baseStyles = "fixed z-50 min-w-80 max-w-md rounded-lg shadow-lg border p-4 transition-all duration-300 transform";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      assignment: "bg-purple-50 border-purple-200 text-purple-800"
    };

    const positionStyles = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };

    const animationStyles = isVisible && !isExiting 
      ? 'translate-y-0 opacity-100 scale-100' 
      : 'translate-y-2 opacity-0 scale-95';

    return `${baseStyles} ${typeStyles[notification.type] || typeStyles.info} ${positionStyles[position]} ${animationStyles}`;
  };

  const getIcon = () => {
    const iconStyles = "w-5 h-5 flex-shrink-0";
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle className={`${iconStyles} text-green-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconStyles} text-yellow-600`} />;
      case 'error':
        return <AlertTriangle className={`${iconStyles} text-red-600`} />;
      case 'assignment':
        return <Bell className={`${iconStyles} text-purple-600`} />;
      default:
        return <Bell className={`${iconStyles} text-blue-600`} />;
    }
  };

  return (
    <div className={getNotificationStyles()}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <h4 className="font-semibold text-sm mb-1">
              {notification.title}
            </h4>
          )}
          
          <p className="text-sm opacity-90">
            {notification.message}
          </p>
          
          {notification.metadata && (
            <div className="mt-2 text-xs opacity-75">
              {notification.metadata.customerName && (
                <div>Customer: {notification.metadata.customerName}</div>
              )}
              {notification.metadata.address && (
                <div>Address: {notification.metadata.address}</div>
              )}
              {notification.metadata.time && (
                <div>Time: {notification.metadata.time}</div>
              )}
            </div>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onAction(notification.id, action);
                    if (action.dismissOnClick !== false) {
                      handleDismiss();
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    action.style === 'primary' 
                      ? 'bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-700'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main Smart Notifications System
const SmartNotificationsSystem = ({ 
  jobs = [], 
  userRole = 'detailer', // 'detailer' or 'admin'
  onJobAction,
  settings = {}
}) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    jobAssignments: true,
    delays: true,
    completions: true,
    ...settings
  });
  const [lastCheckedJobs, setLastCheckedJobs] = useState(new Map());

  // Audio for notifications
  const playNotificationSound = useCallback(() => {
    if (notificationSettings.sound) {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [notificationSettings.sound]);

  // Add notification to the stack
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);
    playNotificationSound();

    // Request permission for browser notifications if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(notification.title || 'Prime Detailing', {
        body: notification.message,
        icon: '/favicon.ico', // Update with your app icon
        tag: notification.type,
        requireInteraction: notification.persistent
      });
    }
  }, [playNotificationSound]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Handle notification actions
  const handleNotificationAction = useCallback((notificationId, action) => {
    if (onJobAction && action.jobId) {
      onJobAction(action.jobId, action.type, action.data);
    }

    if (action.callback) {
      action.callback();
    }
  }, [onJobAction]);

  // Check for job changes and trigger notifications
  useEffect(() => {
    jobs.forEach(job => {
      const jobKey = job.id;
      const lastJob = lastCheckedJobs.get(jobKey);
      
      if (!lastJob) {
        // First time seeing this job
        setLastCheckedJobs(prev => new Map(prev).set(jobKey, job));
        return;
      }

      // Check for status changes
      if (lastJob.status !== job.status) {
        handleJobStatusChange(lastJob, job);
      }

      // Check for delays
      checkForDelays(job);

      // Update last checked job
      setLastCheckedJobs(prev => new Map(prev).set(jobKey, job));
    });
  }, [jobs]);

  // Handle job status changes
  const handleJobStatusChange = (oldJob, newJob) => {
    if (userRole === 'detailer') {
      // Notifications for detailers
      if (oldJob.status === null && newJob.status === 'CONFIRMED' && notificationSettings.jobAssignments) {
        addNotification({
          type: 'assignment',
          title: '🚗 New Job Assigned!',
          message: `You've been assigned a new job for ${newJob.customer.firstName} ${newJob.customer.lastName}`,
          metadata: {
            customerName: `${newJob.customer.firstName} ${newJob.customer.lastName}`,
            address: `${newJob.customer.address}, ${newJob.customer.city}`,
            time: newJob.time
          },
          actions: [
            {
              label: 'View Job',
              style: 'primary',
              type: 'view',
              jobId: newJob.id
            },
            {
              label: 'Start Navigation',
              type: 'navigate',
              jobId: newJob.id
            }
          ],
          persistent: true
        });
      }
    } else if (userRole === 'admin') {
      // Notifications for admin
      if (newJob.status === 'COMPLETED' && notificationSettings.completions) {
        addNotification({
          type: 'success',
          title: '✅ Job Completed',
          message: `${newJob.detailer?.name || 'Detailer'} completed job for ${newJob.customer.firstName} ${newJob.customer.lastName}`,
          metadata: {
            customerName: `${newJob.customer.firstName} ${newJob.customer.lastName}`,
            detailer: newJob.detailer?.name
          }
        });
      }
    }
  };

  // Check for job delays
  const checkForDelays = (job) => {
    if (!notificationSettings.delays) return;

    const appointmentTime = new Date(`${job.date} ${job.time}`);
    const now = new Date();
    const delayThreshold = 15 * 60 * 1000; // 15 minutes

    const isLate = now > appointmentTime + delayThreshold;
    const hasDelayNotification = notifications.some(n => 
      n.metadata?.jobId === job.id && n.type === 'warning'
    );

    if (isLate && job.status === 'CONFIRMED' && !hasDelayNotification) {
      if (userRole === 'detailer') {
        addNotification({
          type: 'warning',
          title: '⏰ Running Late',
          message: `You're 15+ minutes late for your appointment with ${job.customer.firstName} ${job.customer.lastName}`,
          metadata: {
            jobId: job.id,
            customerName: `${job.customer.firstName} ${job.customer.lastName}`,
            scheduledTime: job.time
          },
          actions: [
            {
              label: 'Mark En Route',
              style: 'primary',
              type: 'status',
              jobId: job.id,
              data: { status: 'EN_ROUTE' }
            },
            {
              label: 'Call Customer',
              type: 'call',
              jobId: job.id
            }
          ],
          duration: 10000
        });
      } else if (userRole === 'admin') {
        addNotification({
          type: 'warning',
          title: '⚠️ Job Delayed',
          message: `${job.detailer?.name || 'Detailer'} is late for ${job.customer.firstName} ${job.customer.lastName}`,
          metadata: {
            jobId: job.id,
            detailer: job.detailer?.name,
            customerName: `${job.customer.firstName} ${job.customer.lastName}`
          },
          actions: [
            {
              label: 'Contact Detailer',
              style: 'primary',
              type: 'contact',
              jobId: job.id
            },
            {
              label: 'Reassign Job',
              type: 'reassign',
              jobId: job.id
            }
          ],
          duration: 15000
        });
      }
    }
  };

  // Settings panel component
  const NotificationSettings = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notificationSettings.sound ? (
                <Volume2 className="w-4 h-4 text-gray-500 mr-2" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-700">Sound</span>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, sound: !prev.sound }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.sound ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.sound ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Job Assignments</span>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, jobAssignments: !prev.jobAssignments }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.jobAssignments ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.jobAssignments ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Delays & Late Jobs</span>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, delays: !prev.delays }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.delays ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.delays ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Job Completions</span>
            </div>
            <button
              onClick={() => setNotificationSettings(prev => ({ ...prev, completions: !prev.completions }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationSettings.completions ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationSettings.completions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowSettings(false)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Notification Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-4 left-4 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow z-40"
        title="Notification Settings"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {/* Toast Notifications */}
      {notifications.map(notification => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
          onAction={handleNotificationAction}
        />
      ))}

      {/* Settings Modal */}
      {showSettings && <NotificationSettings />}
    </>
  );
};

export default SmartNotificationsSystem;