// src/components/AvailabilityCalendar.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const AvailabilityCalendar = ({ 
  selectedDate, 
  onDateSelect, 
  businessConfig, 
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch availability data when month changes
  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get first and last day of current month view (including prev/next month days)
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Add padding to show full calendar grid
      const startDate = new Date(startOfMonth);
      startDate.setDate(startDate.getDate() - startOfMonth.getDay());
      
      const endDate = new Date(endOfMonth);
      endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/availability?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );

      const data = await response.json();

      if (data.success) {
        setAvailability(data.availability);
      } else {
        setError('Failed to load availability');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to ensure full calendar grid
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayAvailability = availability.find(day => day.date === dateStr);
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isSelected: dateStr === selectedDate,
        availability: dayAvailability || { 
          isWorkingDay: false, 
          timeSlots: [] 
        }
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getDateStatus = (day) => {
    const now = new Date();
    const isPast = day.date < now.setHours(0, 0, 0, 0);
    
    if (isPast) {
      return { 
        status: 'past', 
        color: 'text-gray-300 bg-gray-50 cursor-not-allowed',
        indicator: null,
        message: 'Past date'
      };
    }
    
    if (!day.availability.isWorkingDay) {
      return { 
        status: 'closed', 
        color: 'text-gray-400 bg-gray-100 cursor-not-allowed',
        indicator: <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full"></div>,
        message: 'Not a working day'
      };
    }
    
    const availableSlots = day.availability.timeSlots?.filter(slot => slot.available) || [];
    
    if (availableSlots.length === 0) {
      return { 
        status: 'booked', 
        color: 'text-red-600 bg-red-50 cursor-not-allowed border-red-200',
        indicator: <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>,
        message: 'Fully booked'
      };
    }
    
    if (day.isSelected) {
      return { 
        status: 'selected', 
        color: 'text-white bg-blue-600 border-blue-600 ring-2 ring-blue-500 ring-opacity-50',
        indicator: <CheckCircle className="absolute top-1 right-1 w-3 h-3 text-white" />,
        message: `${availableSlots.length} slot(s) available`
      };
    }
    
    return { 
      status: 'available', 
      color: 'text-gray-900 bg-white border-gray-200 hover:bg-green-50 hover:border-green-300 cursor-pointer',
      indicator: <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>,
      message: `${availableSlots.length} slot(s) available`
    };
  };

  const handleDateClick = (day) => {
    const status = getDateStatus(day);
    if (status.status === 'available' && onDateSelect) {
      onDateSelect(day.dateStr, day.availability);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    if (onDateSelect) {
      const today = new Date().toISOString().split('T')[0];
      const todayAvailability = availability.find(day => day.date === today);
      if (todayAvailability) {
        onDateSelect(today, todayAvailability);
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth();

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load calendar</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <button
            onClick={fetchAvailability}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const status = getDateStatus(day);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                relative p-2 h-10 flex items-center justify-center text-sm font-medium
                border rounded-md transition-all duration-200
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
                ${day.isToday ? 'font-bold' : ''}
                ${status.color}
              `}
              title={status.message}
            >
              <span className={day.isToday ? 'relative z-10' : ''}>
                {day.date.getDate()}
              </span>
              {status.indicator}
              
              {/* Today indicator ring */}
              {day.isToday && !day.isSelected && (
                <div className="absolute inset-0 border-2 border-blue-400 rounded-md pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Booked</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600">Closed</span>
          </div>
        </div>
        
        {businessConfig && (
          <div className="mt-2 text-center text-xs text-gray-500">
            <Clock className="w-3 h-3 inline mr-1" />
            Operating Hours: {businessConfig.operatingHours?.start}:00 AM - {businessConfig.operatingHours?.end}:00 PM
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;