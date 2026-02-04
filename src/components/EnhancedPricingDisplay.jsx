// Enhanced Pricing Display Component - Shows dynamic pricing adjustments
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Info, Calendar, Clock } from 'lucide-react';

const DynamicPricingBadge = ({ pricing }) => {
  if (!pricing || !pricing.appliedRules || pricing.appliedRules.length === 0) {
    return null;
  }

  const hasSurcharge = pricing.finalPrice > pricing.basePrice;
  const hasDiscount = pricing.finalPrice < pricing.basePrice;

  return (
    <div className="mt-3 space-y-2">
      {/* Dynamic Pricing Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
        hasSurcharge ? 'bg-orange-100 text-orange-800' : 
        hasDiscount ? 'bg-green-100 text-green-800' : 
        'bg-gray-100 text-gray-800'
      }`}>
        {hasSurcharge && <TrendingUp className="w-4 h-4" />}
        {hasDiscount && <TrendingDown className="w-4 h-4" />}
        {!hasSurcharge && !hasDiscount && <Info className="w-4 h-4" />}
        
        <span>
          {hasSurcharge && `+$${pricing.adjustmentAmount.toFixed(2)} (${pricing.adjustmentPercentage}%)`}
          {hasDiscount && `-$${Math.abs(pricing.adjustmentAmount).toFixed(2)} (${Math.abs(pricing.adjustmentPercentage)}%)`}
          {!hasSurcharge && !hasDiscount && 'Standard pricing'}
        </span>
      </div>

      {/* Applied Rules */}
      <div className="flex flex-wrap gap-2">
        {pricing.appliedRules.map((rule, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700"
          >
            {rule.label}
          </span>
        ))}
      </div>

      {/* Breakdown Details */}
      {pricing.breakdown && pricing.breakdown.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
            View pricing breakdown
          </summary>
          <div className="mt-2 space-y-1 pl-4 text-gray-600">
            <div className="flex justify-between">
              <span>Base price:</span>
              <span className="font-medium">${pricing.basePrice.toFixed(2)}</span>
            </div>
            {pricing.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{item}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t font-semibold text-gray-900">
              <span>Total:</span>
              <span>${pricing.finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};

const BookingMetadataDisplay = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Info className="w-4 h-4" />
        <span className="font-medium">Booking Details</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{metadata.dayOfWeek}</span>
        </div>
        {metadata.isWeekend && (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
            Weekend
          </span>
        )}
        {metadata.isWinter && (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
            Winter season
          </span>
        )}
      </div>
    </div>
  );
};

const PricingSavingsCallout = ({ regularPrice, discountedPrice }) => {
  const savings = regularPrice - discountedPrice;
  const percentage = ((savings / regularPrice) * 100).toFixed(0);

  if (savings <= 0) return null;

  return (
    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <TrendingDown className="w-5 h-5 text-green-600" />
        <span className="font-semibold text-green-900">You're saving!</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span className="line-through">Regular price:</span>
          <span className="line-through">${regularPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-green-700">
          <span>Your price:</span>
          <span>${discountedPrice.toFixed(2)}</span>
        </div>
        <div className="text-green-600 font-medium">
          Save ${savings.toFixed(2)} ({percentage}%)
        </div>
      </div>
    </div>
  );
};

const PopularPackageBadge = () => (
  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
    POPULAR
  </span>
);

const SavingsBadge = ({ percentage }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
    <TrendingDown className="w-3 h-3" />
    Save {percentage}%
  </span>
);

// Example usage in a booking form
const EnhancedPricingDisplay = ({ 
  basePrice, 
  dynamicPricing, 
  isPackage = false,
  packageSavings = null,
  showCallToAction = true 
}) => {
  const finalPrice = dynamicPricing?.finalPrice || basePrice;
  const hasDynamicPricing = dynamicPricing && dynamicPricing.appliedRules?.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
        </div>
        
        {isPackage && packageSavings && (
          <SavingsBadge percentage={packageSavings.percentage} />
        )}
      </div>

      {/* Main Price Display */}
      <div className="mb-4">
        {hasDynamicPricing && (
          <div className="text-sm text-gray-500 mb-1">
            Base price: <span className="line-through">${dynamicPricing.basePrice.toFixed(2)}</span>
          </div>
        )}
        <div className="text-3xl font-bold text-gray-900">
          ${finalPrice.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Total estimated cost
        </div>
      </div>

      {/* Dynamic Pricing Info */}
      {hasDynamicPricing && (
        <DynamicPricingBadge pricing={dynamicPricing} />
      )}

      {/* Package Savings */}
      {isPackage && packageSavings && (
        <PricingSavingsCallout 
          regularPrice={packageSavings.regular}
          discountedPrice={packageSavings.package}
        />
      )}

      {/* Metadata */}
      {dynamicPricing?.metadata && (
        <BookingMetadataDisplay metadata={dynamicPricing.metadata} />
      )}

      {/* Call to Action */}
      {showCallToAction && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            💡 Book during off-peak hours for better rates
          </p>
        </div>
      )}
    </div>
  );
};

// Export components
export {
  DynamicPricingBadge,
  BookingMetadataDisplay,
  PricingSavingsCallout,
  PopularPackageBadge,
  SavingsBadge,
  EnhancedPricingDisplay
};

export default EnhancedPricingDisplay;