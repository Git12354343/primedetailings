// src/components/NotificationSystem.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Create context
const NotificationContext = createContext();

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [...state, { ...action.payload, id: Date.now() + Math.random() }];
    
    case 'REMOVE_NOTIFICATION':
      return state.filter(notification => notification.id !== action.payload);
    
    case 'CLEAR_ALL':
      return [];
    
    default:
      return state;
  }
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const notification = {
      message,
      type,
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Auto remove after duration (unless persistent)
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }

    return notification.id;
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  // Convenience methods
  const success = (message, options) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
  const error = (message, options) => addNotification(message, NOTIFICATION_TYPES.ERROR, options);
  const warning = (message, options) => addNotification(message, NOTIFICATION_TYPES.WARNING, options);
  const info = (message, options) => addNotification(message, NOTIFICATION_TYPES.INFO, options);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Individual Notification Component
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-lg rounded-lg";
    
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return "text-green-400";
      case NOTIFICATION_TYPES.ERROR:
        return "text-red-400";
      case NOTIFICATION_TYPES.WARNING:
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out transform
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
        ${getStyles()}
        p-4 mb-3 max-w-sm w-full
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="text-sm font-medium">
            {notification.title && (
              <p className="font-semibold mb-1">{notification.title}</p>
            )}
            <p>{notification.message}</p>
          </div>
          
          {notification.action && (
            <div className="mt-2">
              <button
                onClick={notification.action.onClick}
                className="text-sm underline hover:no-underline font-medium"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleRemove}
            className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar for timed notifications */}
      {!notification.persistent && notification.duration > 0 && (
        <div className="mt-2 w-full bg-black bg-opacity-10 rounded-full h-1">
          <div 
            className="bg-current h-1 rounded-full animate-shrink"
            style={{
              animationDuration: `${notification.duration}ms`,
              animationFillMode: 'forwards'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Notification Container Component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

// Enhanced hook with common patterns
export const useApiNotifications = () => {
  const { success, error, warning, info } = useNotifications();

  const notifyApiSuccess = (message = "Operation completed successfully") => {
    success(message);
  };

  const notifyApiError = (err, fallbackMessage = "Something went wrong") => {
    const message = err?.response?.data?.message || err?.message || fallbackMessage;
    error(message, { persistent: true });
  };

  const notifyBookingSuccess = (confirmationCode) => {
    success(`Booking confirmed! Confirmation code: ${confirmationCode}`, {
      duration: 8000,
      title: "Booking Successful"
    });
  };

  const notifyAssignmentSuccess = (detailerName) => {
    success(`Booking assigned to ${detailerName}`, {
      title: "Assignment Complete"
    });
  };

  const notifyStatusUpdate = (status) => {
    info(`Booking status updated to ${status.replace('_', ' ')}`, {
      title: "Status Updated"
    });
  };

  return {
    notifyApiSuccess,
    notifyApiError,
    notifyBookingSuccess,
    notifyAssignmentSuccess,
    notifyStatusUpdate,
    success,
    error,
    warning,
    info
  };
};

// CSS for progress bar animation (add to your index.css)
export const notificationStyles = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-shrink {
  animation-name: shrink;
  animation-timing-function: linear;
}
`;

export default NotificationProvider;