import React, { useState } from 'react';
import { Navigation, MapPin, Smartphone, ExternalLink, Clock } from 'lucide-react';

const StartNavigationComponent = ({ booking, onStartNavigation }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  // Helper function to detect if user is on mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Geocoding function to get lat/lng from address (you can replace with your preferred service)
  const geocodeAddress = async (address) => {
    try {
      // You can replace this with your preferred geocoding service
      // For now, we'll use a simple approach with Google Maps
      const fullAddress = `${address}, ${booking.customer.city}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      
      // Return the encoded address for now - in production you'd want actual coordinates
      return {
        address: fullAddress,
        encodedAddress: encodedAddress,
        // lat: latitude,
        // lng: longitude
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Main navigation function
  const handleStartNavigation = async () => {
    setIsNavigating(true);
    
    try {
      const addressData = await geocodeAddress(booking.customer.address);
      
      if (!addressData) {
        alert('Unable to find location. Please check the address.');
        setIsNavigating(false);
        return;
      }

      const isMobile = isMobileDevice();
      
      if (isMobile) {
        // Mobile deep linking with fallbacks
        await handleMobileNavigation(addressData);
      } else {
        // Desktop - open Google Maps in new tab
        handleDesktopNavigation(addressData);
      }

      // Trigger the callback to update job status
      if (onStartNavigation) {
        onStartNavigation(booking);
      }
      
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Error starting navigation. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  // Handle mobile navigation with app detection
  const handleMobileNavigation = async (addressData) => {
    const { encodedAddress } = addressData;
    
    // If you have lat/lng coordinates, use this format:
    // const googleMapsDeepLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    // For address-based navigation:
    const googleMapsDeepLink = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    const wazeDeepLink = `https://waze.com/ul?q=${encodedAddress}`;
    const appleMapsDeepLink = `http://maps.apple.com/?daddr=${encodedAddress}`;

    // Try to open navigation apps with fallbacks
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // iOS - try Apple Maps first, then Google Maps
      try {
        window.location.href = appleMapsDeepLink;
        // Fallback to Google Maps after a short delay
        setTimeout(() => {
          window.open(googleMapsDeepLink, '_blank');
        }, 1500);
      } catch (error) {
        window.open(googleMapsDeepLink, '_blank');
      }
    } else if (isAndroid) {
      // Android - try Google Maps first, then Waze
      try {
        window.location.href = googleMapsDeepLink;
        // Fallback to Waze after a short delay
        setTimeout(() => {
          window.open(wazeDeepLink, '_blank');
        }, 1500);
      } catch (error) {
        window.open(wazeDeepLink, '_blank');
      }
    } else {
      // Other mobile browsers
      window.open(googleMapsDeepLink, '_blank');
    }
  };

  // Handle desktop navigation
  const handleDesktopNavigation = (addressData) => {
    const { encodedAddress } = addressData;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Quick action buttons for different navigation apps
  const handleQuickNavigation = (app) => {
    const address = `${booking.customer.address}, ${booking.customer.city}`;
    const encodedAddress = encodeURIComponent(address);
    
    const urls = {
      google: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
      waze: `https://waze.com/ul?q=${encodedAddress}`,
      apple: `http://maps.apple.com/?daddr=${encodedAddress}`
    };

    if (urls[app]) {
      if (app === 'apple' || app === 'waze') {
        // Try to open app directly
        window.location.href = urls[app];
      } else {
        // Open in new tab for web-based apps
        window.open(urls[app], '_blank');
      }
      
      // Trigger callback
      if (onStartNavigation) {
        onStartNavigation(booking);
      }
    }
  };

  // Calculate estimated travel time (placeholder - you can integrate with a real API)
  const getEstimatedTravelTime = () => {
    // This would typically come from a mapping service API
    return "12-18 min";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Navigate to Customer</h3>
        </div>
        <div className="text-sm text-gray-500">
          ETA: {getEstimatedTravelTime()}
        </div>
      </div>

      {/* Address Display */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-start">
          <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{booking.customer.address}</p>
            <p className="text-sm text-gray-600">{booking.customer.city}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Button */}
      <button
        onClick={handleStartNavigation}
        disabled={isNavigating}
        className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 mb-4 ${
          isNavigating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
        }`}
      >
        {isNavigating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Starting Navigation...
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 mr-2" />
            Start Navigation
            {isMobileDevice() && <Smartphone className="w-4 h-4 ml-2" />}
          </>
        )}
      </button>

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Or choose your preferred app:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Google Maps */}
          <button
            onClick={() => handleQuickNavigation('google')}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            Google Maps
            <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
          </button>

          {/* Waze */}
          <button
            onClick={() => handleQuickNavigation('waze')}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            Waze
            <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
          </button>

          {/* Apple Maps (iOS only) */}
          {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
            <button
              onClick={() => handleQuickNavigation('apple')}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <div className="w-4 h-4 bg-gray-800 rounded mr-2"></div>
              Apple Maps
              <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Appointment: {booking.time}</span>
          </div>
          <span className="font-medium">
            {booking.customer.firstName} {booking.customer.lastName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StartNavigationComponent;