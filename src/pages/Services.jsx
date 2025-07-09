import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, Loader2, Package, Star } from 'lucide-react';

const Services = () => {
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Category display names
  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'DETAILING': return 'Detailing Services';
      case 'PROTECTION': return 'Protection Services';
      case 'RESTORATION': return 'Restoration Services';
      case 'MAINTENANCE': return 'Maintenance Services';
      case 'SPECIALTY': return 'Specialty Services';
      default: return 'Other Services';
    }
  };

  // Add-on category display names
  const getAddOnCategoryDisplayName = (category) => {
    switch (category) {
      case 'ENHANCEMENT': return 'Enhancement Add-ons';
      case 'PROTECTION': return 'Protection Add-ons';
      case 'CLEANING': return 'Cleaning Add-ons';
      case 'RESTORATION': return 'Restoration Add-ons';
      default: return 'Additional Services';
    }
  };

  // Format pricing display
  const formatPricingDisplay = (pricing) => {
    if (!pricing || Object.keys(pricing).length === 0) {
      return 'Price on request';
    }

    const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Coupe'];
    const availablePrices = vehicleTypes
      .filter(type => pricing[type] && pricing[type] > 0)
      .map(type => ({ type, price: pricing[type] }));

    if (availablePrices.length === 0) {
      return 'Price on request';
    }

    const minPrice = Math.min(...availablePrices.map(p => p.price));
    const maxPrice = Math.max(...availablePrices.map(p => p.price));

    if (minPrice === maxPrice) {
      return `$${minPrice}`;
    } else {
      return `$${minPrice} - $${maxPrice}`;
    }
  };

  // Get pricing breakdown for features
  const getPricingFeatures = (pricing) => {
    if (!pricing || Object.keys(pricing).length === 0) {
      return ['Contact for pricing'];
    }

    const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Coupe'];
    return vehicleTypes
      .filter(type => pricing[type] && pricing[type] > 0)
      .map(type => `${type}: $${pricing[type]}`);
  };

  useEffect(() => {
    const fetchServicesAndAddOns = async () => {
      setLoading(true);
      try {
        const [servicesResponse, addOnsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/services/active`),
          fetch(`${import.meta.env.VITE_API_URL}/services/addons/active`)
        ]);

        const servicesData = await servicesResponse.json();
        const addOnsData = await addOnsResponse.json();

        if (servicesData.success) {
          setServices(servicesData.services);
        }

        if (addOnsData.success) {
          setAddOns(addOnsData.addOns);
        }

        if (!servicesData.success && !addOnsData.success) {
          setError('Failed to load services and add-ons');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Unable to load services. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndAddOns();
  }, []);

  // Group services by category
  const groupedServices = services.reduce((groups, service) => {
    const category = service.category || 'OTHER';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {});

  // Group add-ons by category
  const groupedAddOns = addOns.reduce((groups, addOn) => {
    const category = addOn.category || 'OTHER';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Loading our professional car detailing services...
            </p>
          </div>
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional car detailing services designed to keep your vehicle looking and feeling its best. 
            All services are performed by trained professionals using premium products.
          </p>
        </div>

        {/* Main Services */}
        {Object.keys(groupedServices).length > 0 ? (
          Object.entries(groupedServices)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryServices]) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
                  {getCategoryDisplayName(category)}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {categoryServices
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((service) => (
                      <div key={service.id} className="card p-6 relative">
                        {/* Highlight popular services */}
                        {service.sortOrder <= 2 && (
                          <div className="absolute top-0 right-4 -mt-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Popular
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
                            {service.name}
                          </h3>
                          <div className="text-right">
                            <span className="text-blue-600 font-bold text-lg">
                              {formatPricingDisplay(service.pricing)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          {service.description || 'Professional detailing service tailored to your needs.'}
                        </p>
                        
                        <ul className="space-y-2">
                          {getPricingFeatures(service.pricing).map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          
                          {/* Add category as a feature */}
                          <li className="flex items-center text-sm text-gray-700">
                            <Star className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                            {getCategoryDisplayName(service.category)} service
                          </li>
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Available</h3>
            <p className="text-gray-600">Our services are currently being updated. Please check back soon!</p>
          </div>
        )}

        {/* Add-ons Section */}
        {Object.keys(groupedAddOns).length > 0 && (
          <>
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
                Add-on Services
              </h2>
              <p className="text-gray-600 mb-8">
                Enhance your detailing experience with these additional services that can be added to any package.
              </p>
              
              {Object.entries(groupedAddOns)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, categoryAddOns]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {getAddOnCategoryDisplayName(category)}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAddOns
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((addOn) => (
                          <div key={addOn.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900 flex-1 pr-2">
                                {addOn.name}
                              </h4>
                              <span className="text-green-600 font-bold">
                                +${addOn.price}
                              </span>
                            </div>
                            {addOn.description && (
                              <p className="text-sm text-gray-600">
                                {addOn.description}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Book?</h2>
          <p className="text-gray-600 mb-6">
            Choose your services and schedule an appointment that works for you. We'll come to your location in Montreal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="btn-primary inline-flex items-center justify-center"
            >
              Book Your Service
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/lookup"
              className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              Track Existing Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;