// src/components/dashboard/TodaysSchedule.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const TodaysSchedule = ({ todayBookings }) => {
  if (todayBookings.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="bg-blue-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">Today's Schedule</h3>
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {todayBookings.length} {todayBookings.length === 1 ? 'job' : 'jobs'}
            </span>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Plan Route
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {todayBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {booking.time} - {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                </p>
                <p className="text-sm text-gray-500">
                  {booking.customer.address}, {booking.customer.city}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodaysSchedule;