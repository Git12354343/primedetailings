// src/components/admin/ActiveDetailersSidebar.jsx
import React from 'react';

const ActiveDetailersSidebar = ({ detailers }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Active Detailers</h2>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {detailers.map((detailer) => (
          <div key={detailer.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{detailer.name}</h3>
                <p className="text-sm text-gray-600">{detailer.email}</p>
                <p className="text-sm text-gray-600">{detailer.phone}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {detailer.activeBookings} jobs
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  detailer.activeBookings === 0 
                    ? 'bg-green-100 text-green-800' 
                    : detailer.activeBookings <= 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {detailer.activeBookings === 0 ? 'Available' : 
                   detailer.activeBookings <= 2 ? 'Busy' : 'Very Busy'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveDetailersSidebar;