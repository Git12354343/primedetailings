// utils/helpers.js
const crypto = require('crypto');

// Generate unique confirmation code
const generateConfirmationCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Format phone number
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Validate Canadian postal code
const validatePostalCode = (postalCode) => {
  const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;
  return canadianPostalRegex.test(postalCode);
};

// Calculate business days between dates
const calculateBusinessDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// Get available time slots for a date
const getAvailableTimeSlots = () => {
  return [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];
};

// Check if date is a business day
const isBusinessDay = (date) => {
  const day = new Date(date).getDay();
  return day >= 1 && day <= 5; // Monday to Friday
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Sanitize file name
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};

// Calculate estimated service duration
const calculateServiceDuration = (services, vehicleType) => {
  const baseDurations = {
    'Basic Wash': { Sedan: 60, SUV: 75, Truck: 90, Coupe: 55 },
    'Full Detail': { Sedan: 180, SUV: 240, Truck: 300, Coupe: 165 },
    'Interior Detail': { Sedan: 120, SUV: 150, Truck: 180, Coupe: 110 },
    'Exterior Detail': { Sedan: 90, SUV: 120, Truck: 150, Coupe: 85 }
  };

  let totalDuration = 0;
  services.forEach(service => {
    const duration = baseDurations[service]?.[vehicleType] || 60;
    totalDuration += duration;
  });

  return totalDuration; // in minutes
};

// Validate business hours
const isWithinBusinessHours = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const startTime = 8 * 60; // 8:00 AM
  const endTime = 18 * 60; // 6:00 PM
  
  return timeInMinutes >= startTime && timeInMinutes <= endTime;
};

// Get next business day
const getNextBusinessDay = (date = new Date()) => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

// Parse services from JSON string safely
const parseServices = (servicesString) => {
  try {
    return JSON.parse(servicesString || '[]');
  } catch (error) {
    console.error('Error parsing services:', error);
    return [];
  }
};

// Generate booking summary
const generateBookingSummary = (booking) => {
  const services = parseServices(booking.services);
  const extras = parseServices(booking.extras);
  
  return {
    confirmationCode: booking.confirmationCode,
    customerName: `${booking.firstName} ${booking.lastName}`,
    vehicle: `${booking.year} ${booking.make} ${booking.model}`,
    services: services.join(', '),
    extras: extras.join(', '),
    totalPrice: formatCurrency(booking.totalPrice),
    scheduledDate: new Date(booking.date).toLocaleDateString('en-CA'),
    scheduledTime: booking.time
  };
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Mask sensitive data for logging
const maskSensitiveData = (data) => {
  const masked = { ...data };
  
  if (masked.email) {
    const [local, domain] = masked.email.split('@');
    masked.email = `${local.slice(0, 2)}***@${domain}`;
  }
  
  if (masked.phoneNumber) {
    masked.phoneNumber = `***-***-${masked.phoneNumber.slice(-4)}`;
  }
  
  if (masked.password) {
    masked.password = '***';
  }
  
  return masked;
};

module.exports = {
  generateConfirmationCode,
  formatPhoneNumber,
  validatePostalCode,
  calculateBusinessDays,
  getAvailableTimeSlots,
  isBusinessDay,
  formatCurrency,
  generateSecureToken,
  sanitizeFileName,
  calculateServiceDuration,
  isWithinBusinessHours,
  getNextBusinessDay,
  parseServices,
  generateBookingSummary,
  isValidEmail,
  maskSensitiveData
};