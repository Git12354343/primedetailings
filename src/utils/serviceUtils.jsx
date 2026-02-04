// src/utils/serviceUtils.js - Utility functions for displaying services properly

export const parseServices = (services, availableServices = []) => {
  if (!services) return [];
  
  try {
    // If services is already an array of strings, return it
    if (Array.isArray(services) && services.length > 0 && typeof services[0] === 'string') {
      return services;
    }
    
    // If services is a JSON string, parse it
    let parsedServices = Array.isArray(services) ? services : JSON.parse(services);
    
    // If parsed services are objects with id/name, extract names
    if (parsedServices.length > 0 && typeof parsedServices[0] === 'object') {
      return parsedServices.map(service => service.name || service.serviceName || 'Unknown Service');
    }
    
    // If parsed services are IDs, look up names from available services
    if (parsedServices.length > 0 && typeof parsedServices[0] === 'number') {
      return parsedServices.map(serviceId => {
        const foundService = availableServices.find(s => s.id === serviceId);
        return foundService ? foundService.name : `Service #${serviceId}`;
      });
    }
    
    // If parsed services are already strings, return them
    return parsedServices;
    
  } catch (error) {
    console.warn('Error parsing services:', error);
    return Array.isArray(services) ? services : [];
  }
};

export const parseExtras = (extras, availableAddOns = []) => {
  if (!extras) return [];
  
  try {
    // If extras is already an array of strings, return it
    if (Array.isArray(extras) && extras.length > 0 && typeof extras[0] === 'string') {
      return extras;
    }
    
    // If extras is a JSON string, parse it
    let parsedExtras = Array.isArray(extras) ? extras : JSON.parse(extras);
    
    // If parsed extras are objects with id/name, extract names
    if (parsedExtras.length > 0 && typeof parsedExtras[0] === 'object') {
      return parsedExtras.map(extra => extra.name || extra.addonName || 'Unknown Add-on');
    }
    
    // If parsed extras are IDs, look up names from available add-ons
    if (parsedExtras.length > 0 && typeof parsedExtras[0] === 'number') {
      return parsedExtras.map(extraId => {
        const foundExtra = availableAddOns.find(a => a.id === extraId);
        return foundExtra ? foundExtra.name : `Add-on #${extraId}`;
      });
    }
    
    // If parsed extras are already strings, return them
    return parsedExtras;
    
  } catch (error) {
    console.warn('Error parsing extras:', error);
    return Array.isArray(extras) ? extras : [];
  }
};

// Component for displaying services with proper names
export const ServiceDisplay = ({ services, availableServices = [], className = "" }) => {
  const serviceNames = parseServices(services, availableServices);
  
  if (serviceNames.length === 0) {
    return <span className={`text-gray-500 text-xs ${className}`}>No services</span>;
  }
  
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {serviceNames.slice(0, 3).map((serviceName, index) => (
        <span
          key={index}
          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
        >
          {serviceName}
        </span>
      ))}
      {serviceNames.length > 3 && (
        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
          +{serviceNames.length - 3} more
        </span>
      )}
    </div>
  );
};

// Component for displaying extras with proper names
export const ExtrasDisplay = ({ extras, availableAddOns = [], className = "" }) => {
  const extraNames = parseExtras(extras, availableAddOns);
  
  if (extraNames.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {extraNames.map((extraName, index) => (
        <span
          key={index}
          className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
        >
          {extraName}
        </span>
      ))}
    </div>
  );
};