import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Sparkles, Shield, Zap, ChevronRight, Package, Wrench, Star, Loader2 } from 'lucide-react';

const ServicesOverview = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Map service categories to icons
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'DETAILING':
        return <Sparkles className="w-8 h-8 text-blue-600" />;
      case 'PROTECTION':
        return <Shield className="w-8 h-8 text-blue-600" />;
      case 'RESTORATION':
        return <Star className="w-8 h-8 text-blue-600" />;
      case 'MAINTENANCE':
        return <Zap className="w-8 h-8 text-blue-600" />;
      case 'SPECIALTY':
        return <Wrench className="w-8 h-8 text-blue-600" />;
      default:
        return <Package className="w-8 h-8 text-blue-600" />;
    }
  };

  // Get the lowest price across all vehicle types
  const getStartingPrice = (servicePricing) => {
    if (!servicePricing || Object.keys(servicePricing).length === 0) {
      return 'Price on request';
    }
    
    const prices = Object.values(servicePricing).filter(price => price > 0);
    if (prices.length === 0) {
      return 'Price on request';
    }
    
    const minPrice = Math.min(...prices);
    return `Starting at $${minPrice}`;
  };

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/services/active`);
        const data = await response.json();

        if (data.success) {
          // Sort by sortOrder and take top 4 services for overview
          const sortedServices = data.services
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .slice(0, 4);
          setServices(sortedServices);
        } else {
          setError('Failed to load services');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Unable to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading our services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Our Services
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Professional car detailing services tailored to your vehicle's needs
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional car detailing services tailored to your vehicle's needs
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-yellow-800">No services are currently available.</p>
              <p className="text-yellow-600 text-sm mt-2">Please check back later or contact us directly.</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-8 ${
            services.length === 1 ? 'max-w-sm mx-auto' :
            services.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
            services.length === 3 ? 'md:grid-cols-3 max-w-4xl mx-auto' :
            'md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
                  {getCategoryIcon(service.category)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {service.name}
                </h3>
                <p className="text-gray-600 mb-4 text-center line-clamp-3">
                  {service.description || 'Professional detailing service tailored to your needs.'}
                </p>
                <p className="text-blue-600 font-semibold text-center">
                  {getStartingPrice(service.pricing)}
                </p>
                
                {/* Vehicle type pricing hints */}
                {service.pricing && Object.keys(service.pricing).length > 1 && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      Pricing varies by vehicle type
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/services"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            View All Services
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;