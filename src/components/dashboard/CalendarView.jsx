// src/components/dashboard/CalendarView.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProfessionalJobCard from './ProfessionalJobCard';

const CalendarView = ({ 
  bookings, 
  onStatusUpdate, 
  onEditNotes, 
  timeTracking, 
  calculateWorkTime,
  activeJob 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Get the first day of the month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const formatDate = (year, month, day) => {
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getBookingsForDay = (day) => {
    if (!day) return [];
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date).toISOString().split('T')[0];
      return bookingDate === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-orange-500';
      case 'COMPLETED':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = day && 
              currentDate.getFullYear() === new Date().getFullYear() &&
              currentDate.getMonth() === new Date().getMonth() &&
              day === new Date().getDate();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 rounded-lg transition-colors ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`text-xs p-2 rounded cursor-pointer text-white transition-all hover:scale-105 ${getStatusColor(booking.status)}`}
                          title={`${booking.customer.firstName} ${booking.customer.lastName} - ${booking.time}`}
                        >
                          <div className="font-medium truncate">
                            {booking.time}
                          </div>
                          <div className="truncate">
                            {booking.customer.firstName} {booking.customer.lastName}
                          </div>
                          <div className="truncate text-xs opacity-90">
                            {booking.vehicle.make} {booking.vehicle.model}
                          </div>
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500 p-1 text-center bg-gray-100 rounded">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={onStatusUpdate}
          onEditNotes={onEditNotes}
          timeTracking={timeTracking[selectedBooking.id]}
          calculateWorkTime={() => calculateWorkTime(selectedBooking.id)}
          isActive={activeJob?.id === selectedBooking.id}
        />
      )}
    </div>
  );
};

// Booking Detail Modal for Calendar View
const BookingDetailModal = ({ 
  booking, 
  onClose, 
  onStatusUpdate, 
  onEditNotes, 
  timeTracking, 
  calculateWorkTime, 
  isActive 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Job Details - {booking.customer.firstName} {booking.customer.lastName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <ProfessionalJobCard
            booking={booking}
            onStatusUpdate={onStatusUpdate}
            onEditNotes={onEditNotes}
            timeTracking={timeTracking}
            calculateWorkTime={calculateWorkTime}
            isActive={isActive}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarView;