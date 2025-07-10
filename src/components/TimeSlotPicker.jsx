// src/components/TimeSlotPicker.jsx
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

const TimeSlotPicker = ({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  availability, 
  businessConfig,
  loading = false,
  className = '' 
}) => {
  const [validationMessage, setValidationMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Validate selected time slot when it changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      validateTimeSlot();
    }
  }, [selectedDate, selectedTime]);

  const validateTimeSlot = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsValidating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/availability/check?date=${selectedDate}&timeSlot=${getTimeSlotId(selectedTime)}`
      );
      
      const data = await response.json();
      
      if (data.success && data.available) {
        setValidationMessage('✓ Time slot confirmed available');
      } else {
        setValidationMessage(`⚠ ${data.reason || 'Time slot no longer available'}`);
        if (onTimeSelect) {
          onTimeSelect(''); // Clear selection if no longer available
        }
      }
    } catch (error) {
      console.error('Error validating time slot:', error);
      setValidationMessage('Unable to validate time slot');
    } finally {
      setIsValidating(false);
    }
  };

  // Map time labels to slot IDs
  const getTimeSlotId = (timeLabel) => {
    const timeSlotMapping = {
      '8:00 AM': 'morning',
      '12:00 PM': 'afternoon'
    };
    return timeSlotMapping[timeLabel];
  };

  // Get available time slots for the selected date
  const getAvailableTimeSlots = () => {
    if (!availability) return [];
    
    return availability.timeSlots?.filter(slot => slot.available) || [];
  };

  // Format time slot display information
  const formatTimeSlotInfo = (slot) => {
    if (!businessConfig) return {};
    
    const duration = businessConfig.serviceDuration || 4;
    const buffer = businessConfig.bufferTime || 2;
    
    return {
      serviceTime: `${slot.startHour}:00 - ${slot.startHour + duration}:00`,
      totalTime: `${duration}h service + ${buffer}h buffer`,
      endTime: `Complete by ${slot.startHour + duration + buffer}:00`
    };
  };

  // Handle time slot selection
  const handleTimeSelect = (slot) => {
    if (onTimeSelect) {
      onTimeSelect(slot.label);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading available time slots...</p>
        </div>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Please select a date first</p>
          <p className="text-sm text-gray-500 mt-1">Choose an available date from the calendar above</p>
        </div>
      </div>
    );
  }

  const availableSlots = getAvailableTimeSlots();

  if (!availability?.isWorkingDay) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Not a working day</p>
          <p className="text-sm text-gray-500 mt-1">Please select a different date</p>
        </div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No time slots available</p>
          <p className="text-sm text-gray-500 mt-1">This date is fully booked. Please select another date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Available Time Slots
        </h3>
        
        {selectedDate && (
          <span className="text-sm text-gray-600">
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        )}
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        {availableSlots.map(slot => {
          const isSelected = selectedTime === slot.label;
          const timeInfo = formatTimeSlotInfo(slot);
          
          return (
            <div
              key={slot.id}
              onClick={() => handleTimeSelect(slot)}
              className={`
                relative p-4 border rounded-lg cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected 
                        ? 'border-blue-600 bg-blue-600' 
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        {slot.label}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        Service Time: {timeInfo.serviceTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                  {businessConfig && (
                    <p className="text-xs text-gray-500 mt-1">
                      {businessConfig.serviceDuration}h duration
                    </p>
                  )}
                </div>
              </div>
              
              {/* Additional Info */}
              {businessConfig && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span className="flex items-center">
                      <Info className="w-3 h-3 mr-1" />
                      {timeInfo.totalTime}
                    </span>
                    <span>
                      {timeInfo.endTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Validation Message */}
      {(validationMessage || isValidating) && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center space-x-2">
            {isValidating ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : validationMessage.startsWith('✓') ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span className={`text-sm font-medium ${
              isValidating ? 'text-blue-600' :
              validationMessage.startsWith('✓') ? 'text-green-600' : 'text-amber-600'
            }`}>
              {isValidating ? 'Validating time slot...' : validationMessage}
            </span>
          </div>
        </div>
      )}

      {/* Business Info */}
      {businessConfig && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Service Information</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <p><strong>Service Duration:</strong> {businessConfig.serviceDuration} hours</p>
              <p><strong>Buffer Time:</strong> {businessConfig.bufferTime} hours between appointments</p>
              <p><strong>Operating Hours:</strong> {businessConfig.operatingHours?.start}:00 AM - {businessConfig.operatingHours?.end}:00 PM</p>
              {businessConfig.minAdvanceHours && (
                <p><strong>Advance Notice:</strong> Minimum {businessConfig.minAdvanceHours} hours required</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;