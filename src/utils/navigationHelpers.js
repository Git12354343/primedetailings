export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

export const startNavigation = async (address, city) => {
  const fullAddress = `${address}, ${city}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    return handleMobileNavigation(encodedAddress);
  } else {
    return handleDesktopNavigation(encodedAddress);
  }
};

const handleMobileNavigation = async (encodedAddress) => {
  // Deep link format for Google Maps with API
  const googleMapsDeepLink = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const wazeDeepLink = `https://waze.com/ul?q=${encodedAddress}`;
  const appleMapsDeepLink = `http://maps.apple.com/?daddr=${encodedAddress}`;

  if (isIOS()) {
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
  } else if (isAndroid()) {
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

const handleDesktopNavigation = (encodedAddress) => {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  window.open(googleMapsUrl, '_blank');
};

export const getNavigationApps = () => {
  const apps = [
    {
      name: 'Google Maps',
      key: 'google',
      available: true,
      getUrl: (address) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    },
    {
      name: 'Waze',
      key: 'waze', 
      available: true,
      getUrl: (address) => `https://waze.com/ul?q=${encodeURIComponent(address)}`
    }
  ];

  if (isIOS()) {
    apps.push({
      name: 'Apple Maps',
      key: 'apple',
      available: true,
      getUrl: (address) => `http://maps.apple.com/?daddr=${encodeURIComponent(address)}`
    });
  }

  return apps;
};