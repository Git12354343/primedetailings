// backend/controllers/availabilityController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Business configuration
const BUSINESS_CONFIG = {
  // Operating hours
  operatingHours: {
    start: 8, // 8 AM
    end: 18   // 6 PM
  },
  
  // Service duration and buffer times (in hours)
  serviceDuration: 4,    // 4 hours per service
  bufferTime: 2,         // 2 hours buffer between appointments
  totalSlotTime: 6,      // 4 hours service + 2 hours buffer
  
  // Working days (0 = Sunday, 1 = Monday, etc.)
  workingDays: [0, 1, 2, 3, 4, 5, 6], // All days
  
  // Advance booking settings
  minAdvanceHours: 24,   // Minimum 24 hours advance notice
  maxAdvanceDays: 60,    // Maximum 60 days in advance
  
  // Time slots (considering 6-hour blocks: 4h service + 2h buffer)
  timeSlots: [
    { id: 'morning', label: '8:00 AM', startHour: 8, endHour: 14 },   // 8 AM - 2 PM
    { id: 'afternoon', label: '12:00 PM', startHour: 12, endHour: 18 } // 12 PM - 6 PM
  ]
};

// Calculate if date/time is available for booking
const isTimeSlotAvailable = async (date, timeSlot) => {
  try {
    const requestedDate = new Date(date);
    const now = new Date();
    
    // Check if date is in the past
    if (requestedDate < now.setHours(0, 0, 0, 0)) {
      return { available: false, reason: 'Date is in the past' };
    }
    
    // Check advance booking window
    const hoursUntilBooking = (requestedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilBooking < BUSINESS_CONFIG.minAdvanceHours) {
      return { available: false, reason: `Minimum ${BUSINESS_CONFIG.minAdvanceHours} hours advance notice required` };
    }
    
    const daysUntilBooking = hoursUntilBooking / 24;
    if (daysUntilBooking > BUSINESS_CONFIG.maxAdvanceDays) {
      return { available: false, reason: `Cannot book more than ${BUSINESS_CONFIG.maxAdvanceDays} days in advance` };
    }
    
    // Check if it's a working day
    const dayOfWeek = requestedDate.getDay();
    if (!BUSINESS_CONFIG.workingDays.includes(dayOfWeek)) {
      return { available: false, reason: 'Not a working day' };
    }
    
    // Find the time slot configuration
    const slotConfig = BUSINESS_CONFIG.timeSlots.find(slot => slot.id === timeSlot);
    if (!slotConfig) {
      return { available: false, reason: 'Invalid time slot' };
    }
    
    // Look for any booking on the same date that isn't canceled
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: requestedDate,
        status: {
          not: 'CANCELED'
        }
      }
    });
    
    // Since you work alone, any existing booking on the same date means unavailable
    if (existingBookings.length > 0) {
      return { 
        available: false, 
        reason: 'Time slot unavailable - another appointment scheduled',
        conflictingBookings: existingBookings.length
      };
    }
    
    return { 
      available: true, 
      timeSlot: slotConfig,
      estimatedDuration: `${BUSINESS_CONFIG.serviceDuration} hours`,
      startTime: `${slotConfig.startHour.toString().padStart(2, '0')}:00`,
      endTime: `${(slotConfig.startHour + BUSINESS_CONFIG.serviceDuration).toString().padStart(2, '0')}:00`
    };
    
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return { available: false, reason: 'Error checking availability' };
  }
};

// Get available dates and time slots for a date range
const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + (30 * 24 * 60 * 60 * 1000)); // Default 30 days
    
    const availability = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayAvailability = {
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        isWorkingDay: BUSINESS_CONFIG.workingDays.includes(currentDate.getDay()),
        timeSlots: []
      };
      
      // Check each time slot for this date
      for (const slot of BUSINESS_CONFIG.timeSlots) {
        const availability = await isTimeSlotAvailable(dateStr, slot.id);
        dayAvailability.timeSlots.push({
          id: slot.id,
          label: slot.label,
          startHour: slot.startHour,
          endHour: slot.endHour,
          ...availability
        });
      }
      
      availability.push(dayAvailability);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      availability,
      businessConfig: {
        operatingHours: BUSINESS_CONFIG.operatingHours,
        serviceDuration: BUSINESS_CONFIG.serviceDuration,
        bufferTime: BUSINESS_CONFIG.bufferTime,
        minAdvanceHours: BUSINESS_CONFIG.minAdvanceHours,
        maxAdvanceDays: BUSINESS_CONFIG.maxAdvanceDays,
        timeSlots: BUSINESS_CONFIG.timeSlots
      }
    });
    
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check specific date/time availability
const checkTimeSlot = async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    
    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Date and time slot are required'
      });
    }
    
    const availability = await isTimeSlotAvailable(date, timeSlot);
    
    res.json({
      success: true,
      date,
      timeSlot,
      ...availability
    });
    
  } catch (error) {
    console.error('Check time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking time slot',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get blocked dates (dates with existing bookings)
const getBlockedDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days default
    
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
        status: {
          not: 'CANCELED'
        }
      },
      select: {
        date: true,
        time: true,
        status: true,
        confirmationCode: true
      }
    });
    
    // Create array of blocked dates
    const blockedDates = bookings.map(booking => ({
      date: booking.date.toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      confirmationCode: booking.confirmationCode
    }));
    
    res.json({
      success: true,
      blockedDates,
      totalBlocked: blockedDates.length
    });
    
  } catch (error) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked dates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validate booking request before creation
const validateBookingRequest = async (req, res) => {
  try {
    const { date, time, services = [], addOns = [], vehicleType } = req.body;
    
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }
    
    // Map frontend time labels to our time slot IDs
    const timeSlotMapping = {
      '8:00 AM': 'morning',
      '12:00 PM': 'afternoon'
    };
    
    const timeSlotId = timeSlotMapping[time];
    if (!timeSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot selected'
      });
    }
    
    // Check availability
    const availability = await isTimeSlotAvailable(date, timeSlotId);
    
    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: availability.reason,
        conflictingBookings: availability.conflictingBookings
      });
    }
    
    // Calculate estimated duration
    let estimatedDuration = BUSINESS_CONFIG.serviceDuration;
    if (addOns && addOns.length > 0) {
      estimatedDuration += addOns.length * 0.5; // 30 minutes per add-on
    }
    
    res.json({
      success: true,
      validation: {
        available: true,
        date,
        time,
        timeSlot: availability.timeSlot,
        estimatedDuration: `${estimatedDuration} hours`,
        startTime: availability.startTime,
        endTime: availability.endTime
      }
    });
    
  } catch (error) {
    console.error('Validate booking request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating booking request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get business configuration
const getBusinessConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      config: BUSINESS_CONFIG
    });
  } catch (error) {
    console.error('Get business config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching business configuration'
    });
  }
};

module.exports = {
  getAvailability,
  checkTimeSlot,
  getBlockedDates,
  validateBookingRequest,
  getBusinessConfig,
  isTimeSlotAvailable,
  BUSINESS_CONFIG
};