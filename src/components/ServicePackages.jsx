// Service Packages Component - One-click popular service bundles
import React, { useState } from 'react';
import { Package, Check, Star, TrendingUp, Sparkles } from 'lucide-react';

const ServicePackages = ({ vehicleType, onPackageSelect, packages }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Default packages if none provided
  const defaultPackages = [
    {
      id: 'essential',
      name: 'Essential Clean',
      description: 'Perfect for regular maintenance',
      services: ['Exterior Wash', 'Interior Vacuum', 'Window Cleaning'],
      pricing: {
        sedan: { regular: 89, package: 69 },
        suv: { regular: 109, package: 89 },
        truck: { regular: 119, package: 99 }
      },
      duration: 90,
      popular: false,
      badge: null
    },
    {
      id: 'premium',
      name: 'Premium Detail',
      description: 'Most popular choice for complete care',
      services: ['Full Exterior Detail', 'Full Interior Detail', 'Clay Bar Treatment', 'Tire Shine'],
      pricing: {
        sedan: { regular: 189, package: 149 },
        suv: { regular: 229, package: 189 },
        truck: { regular: 249, package: 209 }
      },
      duration: 180,
      popular: true,
      badge: 'MOST POPULAR',
      highlight: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate Protection',
      description: 'Complete detail with ceramic coating',
      services: ['Premium Detail', 'Ceramic Coating', 'Paint Correction', 'Engine Bay Cleaning'],
      pricing: {
        sedan: { regular: 449, package: 399 },
        suv: { regular: 519, package: 469 },
        truck: { regular: 569, package: 519 }
      },
      duration: 360,
      popular: false,
      badge: 'BEST VALUE'
    }
  ];

  const displayPackages = packages || defaultPackages;
  const filteredPackages = displayPackages.filter(pkg => 
    pkg.pricing[vehicleType?.toLowerCase()]
  );

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg.id);
    if (onPackageSelect) {
      const pricing = pkg.pricing[vehicleType?.toLowerCase()];
      onPackageSelect({
        packageId: pkg.id,
        packageName: pkg.name,
        services: pkg.services,
        price: pricing.package,
        regularPrice: pricing.regular,
        savings: pricing.regular - pricing.package,
        duration: pkg.duration
      });
    }
  };

  const calculateSavings = (pkg) => {
    const pricing = pkg.pricing[vehicleType?.toLowerCase()];
    if (!pricing) return { amount: 0, percentage: 0 };
    
    const savings = pricing.regular - pricing.package;
    const percentage = Math.round((savings / pricing.regular) * 100);
    
    return { amount: savings, percentage };
  };

  if (!vehicleType) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-blue-900 font-medium">Select a vehicle type to see packages</p>
      </div>
    );
  }

  if (filteredPackages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Popular Packages
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Save time and money with our pre-selected service bundles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPackages.map((pkg) => {
          const pricing = pkg.pricing[vehicleType.toLowerCase()];
          const savings = calculateSavings(pkg);
          const isSelected = selectedPackage === pkg.id;

          return (
            <div
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg)}
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                pkg.highlight 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              } ${
                isSelected 
                  ? 'ring-4 ring-blue-100 border-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } p-6`}
            >
              {/* Badge */}
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white animate-pulse'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}>
                    {pkg.popular && <Star className="w-3 h-3 fill-current" />}
                    {pkg.badge}
                  </span>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Package Name */}
              <div className="mb-3 mt-2">
                <h4 className="text-xl font-bold text-gray-900">{pkg.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${pricing.package}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    ${pricing.regular}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    <TrendingUp className="w-3 h-3" />
                    Save ${savings.amount} ({savings.percentage}%)
                  </span>
                </div>
              </div>

              {/* Included Services */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Includes:
                </p>
                {pkg.services.map((service, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{service}</span>
                  </div>
                ))}
              </div>

              {/* Duration */}
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimated {pkg.duration} minutes
              </div>

              {/* Select Button */}
              <button
                className={`w-full mt-4 py-2.5 px-4 rounded-lg font-semibold transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : pkg.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {isSelected ? 'Selected ✓' : 'Select Package'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-900">2,100+</div>
            <div className="text-sm text-gray-600">Vehicles detailed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">4.9/5</div>
            <div className="text-sm text-gray-600">Average rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">~60 sec</div>
            <div className="text-sm text-gray-600">Average booking time</div>
          </div>
        </div>
      </div>

      {/* Custom Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Need something different?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium underline">
            Build a custom package
          </button>
        </p>
      </div>
    </div>
  );
};

export default ServicePackages;