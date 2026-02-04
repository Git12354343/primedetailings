// src/components/PricingCalculator.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, Package, Wrench, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';

const PricingCalculator = ({ 
  vehicleType, 
  selectedServices, 
  selectedAddOns, 
  services, 
  addOns,
  onPricingUpdate,
  showBreakdown = true,
  showEstimate = true,
  className = '' 
}) => {
  const [pricing, setPricing] = useState({
    services: [],
    addOns: [],
    subtotal: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  // Calculate pricing whenever selections change
  useEffect(() => {
    if (vehicleType && (selectedServices.length > 0 || selectedAddOns.length > 0)) {
      calculatePricing();
    } else {
      resetPricing();
    }
  }, [vehicleType, selectedServices, selectedAddOns]);

  const resetPricing = () => {
    const emptyPricing = {
      services: [],
      addOns: [],
      subtotal: 0,
      total: 0
    };
    setPricing(emptyPricing);
    setEstimatedDuration('');
    if (onPricingUpdate) {
      onPricingUpdate(emptyPricing);
    }
  };

  const calculatePricing = async () => {
    setLoading(true);
    setError('');

    try {
      // Use API for accurate pricing
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/calculate-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: selectedServices,
          addOns: selectedAddOns,
          vehicleType: vehicleType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPricing(data.pricing);
        
        // Calculate estimated duration
        const baseDuration = 4; // Base 4 hours
        const addOnDuration = selectedAddOns.length * 0.5; // 30 minutes per add-on
        const totalDuration = baseDuration + addOnDuration;
        setEstimatedDuration(`${totalDuration} hours`);
        
        if (onPricingUpdate) {
          onPricingUpdate(data.pricing);
        }
      } else {
        setError('Failed to calculate pricing');
        // Fallback to local calculation
        calculateLocalPricing();
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
      setError('Unable to fetch pricing');
      // Fallback to local calculation
      calculateLocalPricing();
    } finally {
      setLoading(false);
    }
  };

  // Fallback local pricing calculation
  const calculateLocalPricing = () => {
    const servicesPricing = [];
    const addOnsPricing = [];
    let total = 0;

    // Calculate services pricing
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service && service.pricing && vehicleType) {
        const price = service.pricing[vehicleType] || 0;
        servicesPricing.push({
          id: service.id,
          name: service.name,
          price: price
        });
        total += price;
      }
    });

    // Calculate add-ons pricing
    selectedAddOns.forEach(addOnId => {
      const addOn = addOns.find(a => a.id === addOnId);
      if (addOn) {
        const price = parseFloat(addOn.price);
        addOnsPricing.push({
          id: addOn.id,
          name: addOn.name,
          price: price
        });
        total += price;
      }
    });

    const localPricing = {
      services: servicesPricing,
      addOns: addOnsPricing,
      subtotal: total,
      total: total
    };

    setPricing(localPricing);
    
    if (onPricingUpdate) {
      onPricingUpdate(localPricing);
    }
  };

  // Get vehicle type pricing multiplier info
  const getVehicleTypeInfo = () => {
    switch (vehicleType) {
      case 'Sedan':
        return { 
          icon: '🚗', 
          description: 'Compact and efficient pricing',
          note: 'Standard pricing for sedans'
        };
      case 'SUV':
        return { 
          icon: '🚙', 
          description: 'Larger surface area requires more time',
          note: 'Higher pricing due to size'
        };
      case 'Truck':
        return { 
          icon: '🚚', 
          description: 'Maximum size and complexity',
          note: 'Premium pricing for trucks'
        };
      case 'Coupe':
        return { 
          icon: '🏎️', 
          description: 'Sporty and compact',
          note: 'Efficient pricing for coupes'
        };
      default:
        return { icon: '🚗', description: '', note: '' };
    }
  };

  const vehicleInfo = getVehicleTypeInfo();

  if (!vehicleType) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Select vehicle type to see pricing</p>
          <p className="text-sm text-gray-500 mt-1">Pricing varies by vehicle size and complexity</p>
        </div>
      </div>
    );
  }

  if (selectedServices.length === 0 && selectedAddOns.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Select services to see pricing</p>
          <p className="text-sm text-gray-500 mt-1">Choose from our available services and add-ons</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-blue-600" />
          Pricing Calculator
        </h3>
        
        {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
      </div>

      {/* Vehicle Type Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{vehicleInfo.icon}</span>
          <div>
            <span className="font-medium text-blue-900">{vehicleType}</span>
            <p className="text-sm text-blue-700">{vehicleInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      {showBreakdown && (pricing.services.length > 0 || pricing.addOns.length > 0) && (
        <div className="space-y-4 mb-6">
          {/* Services */}
          {pricing.services.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                Selected Services
              </h4>
              <div className="space-y-2">
                {pricing.services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">{service.name}</span>
                      <p className="text-sm text-gray-600">{vehicleType} pricing</p>
                    </div>
                    <span className="font-semibold text-blue-600">${service.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm text-gray-600">Services subtotal: </span>
                <span className="font-medium text-gray-900">
                  ${pricing.services.reduce((sum, s) => sum + s.price, 0)}
                </span>
              </div>
            </div>
          )}

          {/* Add-ons */}
          {pricing.addOns.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2 text-green-600" />
                Selected Add-ons
              </h4>
              <div className="space-y-2">
                {pricing.addOns.map(addOn => (
                  <div key={addOn.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-800">{addOn.name}</span>
                    <span className="font-semibold text-green-600">+${addOn.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm text-gray-600">Add-ons subtotal: </span>
                <span className="font-medium text-gray-900">
                  ${pricing.addOns.reduce((sum, a) => sum + a.price, 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-900">Total Price:</span>
          <span className="text-2xl font-bold text-blue-600">${pricing.total}</span>
        </div>
        
        {/* Pricing confirmation */}
        <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>Real-time pricing confirmed</span>
        </div>
      </div>

      {/* Estimate Information */}
      {showEstimate && estimatedDuration && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-600" />
            Service Estimate
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Estimated Duration:</span>
                <span className="font-medium text-blue-900">{estimatedDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Service Type:</span>
                <span className="font-medium text-blue-900">Mobile Detailing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Location:</span>
                <span className="font-medium text-blue-900">Your Address</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Notes */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h5 className="font-medium text-yellow-900 mb-1">Pricing Notes</h5>
          <div className="space-y-1 text-xs text-yellow-800">
            <p>• Prices include all materials and equipment</p>
            <p>• Mobile service - we come to you</p>
            <p>• Final price confirmed after booking</p>
            <p>• Weather-dependent services may be rescheduled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;