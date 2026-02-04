import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const initializePushNotifications = async () => {
  const messaging = getMessaging();
  
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.VITE_VAPID_KEY
    });
    
    // Send token to your backend
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};