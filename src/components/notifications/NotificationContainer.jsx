// src/components/notifications/NotificationContainer.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Bell, 
  X,
  User,
  MapPin,
  Clock
} from 'lucide-react';

const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const NotificationCard = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getNotificationStyles = () => {
    const baseStyles = "min-w-80 max-w-md rounded-lg shadow-lg border p-4 transition-all duration-300 transform";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      assignment: "bg-purple-50 border-purple-200 text-purple-800"
    };

    const animationStyles = isVisible && !isExiting 
      ? 'translate-y-0 opacity-100 scale-100' 
      : 'translate-y-2 opacity-0 scale-95';

    return `${baseStyles} ${typeStyles[notification.type] || typeStyles.info} ${animationStyles}`;
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
        return <AlertCircle className={`${iconStyles} text-blue-600`} />;
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
            <div className="mt-2 text-xs opacity-75 space-y-1">
              {notification.metadata.customerName && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {notification.metadata.customerName}
                </div>
              )}
              {notification.metadata.address && (
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {notification.metadata.address}
                </div>
              )}
              {notification.metadata.time && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {notification.metadata.time}
                </div>
              )}
            </div>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (action.callback) action.callback();
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

export default NotificationContainer;