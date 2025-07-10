// src/components/notifications/NotificationProvider.jsx
import React, { createContext, useState, useCallback } from 'react';
import NotificationContainer from './NotificationContainer';

// Create the context
export const NotificationContext = createContext();

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    sound: true,
    jobAssignments: true,
    delays: true,
    completions: true
  });

  // Add notification function
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      duration: 5000, // default duration
      autoDismiss: true, // default auto-dismiss
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss if enabled
    if (newNotification.autoDismiss !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Play sound if enabled
    if (settings.sound && notification.type !== 'info') {
      playNotificationSound();
    }

    // Request browser notification permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show browser notification for important notifications
    if (Notification.permission === 'granted' && notification.persistent) {
      new Notification(notification.title || 'Prime Detailing', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type,
        requireInteraction: notification.persistent
      });
    }
  }, [settings.sound]);

  // Remove notification function
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
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
    } catch (error) {
      console.error('Audio notification error:', error);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const contextValue = {
    notifications,
    settings,
    addNotification,
    removeNotification,
    updateSettings
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;