// src/components/LoadingSkeleton.jsx
import React from 'react';

export const BookingCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
    </div>

    {/* Customer Info */}
    <div className="space-y-3 mb-4">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    </div>

    {/* Vehicle Info */}
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-2">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>

    {/* Services */}
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Action Button */}
    <div className="h-10 bg-gray-200 rounded-lg"></div>
  </div>
);

export const BookingFormSkeleton = () => (
  <div className="max-w-2xl mx-auto animate-pulse">
    {/* Progress Steps */}
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          {step < 4 && <div className="w-16 h-1 mx-2 bg-gray-200"></div>}
        </div>
      ))}
    </div>

    {/* Form Content */}
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>

        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const AdminBookingsSkeleton = () => (
  <div className="divide-y divide-gray-200">
    {[...Array(3)].map((_, index) => (
      <div key={index} className="p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
              <div className="h-5 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const DetailerStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-8 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex}>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Generic skeleton for any content
export const ContentSkeleton = ({ lines = 3, className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    {[...Array(lines)].map((_, index) => (
      <div 
        key={index} 
        className={`h-4 bg-gray-200 rounded mb-3 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      ></div>
    ))}
  </div>
);

export default {
  BookingCardSkeleton,
  BookingFormSkeleton,
  AdminBookingsSkeleton,
  DetailerStatsSkeleton,
  TableSkeleton,
  ContentSkeleton
};