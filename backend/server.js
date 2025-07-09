const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');
const emailService = require('./services/emailService');
require('dotenv').config();

// Import Phase 3 route handlers
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const serviceRoutes = require('./routes/services'); // NEW: Service management routes

const app = express();
const prisma = new PrismaClient();

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Test email service on startup
emailService.testConnection().then(isReady => {
  if (isReady) {
    console.log('📧 Email service initialized successfully');
  } else {
    console.warn('⚠️  Email service not configured properly');
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again later.'
  }
});

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 SMS requests per windowMs
  message: 'Too many SMS requests, please try again later'
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 contact form submissions per windowMs
  message: 'Too many contact submissions, please try again later'
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/bookings/initiate', smsLimiter);
app.use('/api/contact', contactLimiter);

// Phase 3 Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes); // NEW: Service management routes

// In-memory store for temporary verification codes (in production, use Redis)
const verificationCodes = new Map();

// Utility function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Utility function to format phone number
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add +1 if it's a 10-digit number (assuming North American)
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  return `+${digits}`;
};

// UPDATED: Dynamic pricing calculation using database
const calculateTotalPrice = async (services, addOns, vehicleType) => {
  try {
    let totalPrice = 0;

    // Calculate service prices from database
    if (services && services.length > 0) {
      const serviceRecords = await prisma.service.findMany({
        where: {
          id: { in: services.map(id => parseInt(id)) },
          isActive: true
        },
        include: {
          pricing: {
            where: { vehicleType }
          }
        }
      });

      for (const service of serviceRecords) {
        const pricing = service.pricing[0];
        if (pricing) {
          totalPrice += parseFloat(pricing.price);
        }
      }
    }

    // Calculate add-on prices from database
    if (addOns && addOns.length > 0) {
      const addOnRecords = await prisma.addOn.findMany({
        where: {
          id: { in: addOns.map(id => parseInt(id)) },
          isActive: true
        }
      });

      for (const addOn of addOnRecords) {
        totalPrice += parseFloat(addOn.price);
      }
    }

    return totalPrice;
  } catch (error) {
    console.error('Error calculating dynamic pricing:', error);
    
    // Fallback to hardcoded prices if database fails
    const servicePrices = {
      'exterior': 89,
      'interior': 119,
      'paint-protection': 299,
      'express': 49
    };

    const addOnPrices = {
      'engine-bay': 59,
      'headlight-restoration': 79,
      'tire-shine': 29,
      'odor-elimination': 49
    };

    const serviceTotal = services.reduce((total, serviceId) => {
      return total + (servicePrices[serviceId] || 0);
    }, 0);

    const addOnTotal = addOns.reduce((total, addOnId) => {
      return total + (addOnPrices[addOnId] || 0);
    }, 0);

    return serviceTotal + addOnTotal;
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    phase: 'Phase 3 - Authentication & Service Management Ready'
  });
});

// Initiate booking and send SMS verification
app.post('/api/bookings/initiate', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      vehicleType,
      make,
      model,
      year,
      services,
      addOns,
      date,
      time,
      specialInstructions
    } = req.body;

    // Validate required fields
    const requiredFields = {
      firstName, lastName, email, phone, address, city, postalCode,
      vehicleType, make, model, year, services, date, time
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Validate Canadian postal code
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalRegex.test(postalCode)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Canadian postal code'
      });
    }

    // Calculate total price using dynamic pricing
    const totalPrice = await calculateTotalPrice(services, addOns || [], vehicleType);

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store booking data temporarily with verification code
    const bookingId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    verificationCodes.set(bookingId, {
      verificationCode,
      attempts: 0,
      bookingData: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber: formattedPhone,
        address,
        city,
        postalCode: postalCode.toUpperCase(),
        vehicleType,
        make,
        model,
        year: parseInt(year),
        services: JSON.stringify(services),
        extras: addOns && addOns.length > 0 ? JSON.stringify(addOns) : null,
        date: new Date(date),
        time,
        specialInstructions: specialInstructions || null,
        totalPrice: totalPrice
      },
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes expiry
    });

    // Send SMS verification code
    await twilioClient.messages.create({
      body: `Prime Detailing: Your verification code is ${verificationCode}. This code expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    res.json({
      success: true,
      bookingId,
      message: 'Verification code sent successfully',
      ...(process.env.NODE_ENV === 'development' && { 
        developmentMode: true, 
        verificationCode 
      })
    });

  } catch (error) {
    console.error('Error initiating booking:', error);
    
    if (error.code === 21614) { // Twilio error for invalid phone number
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
});

// Verify SMS code and confirm booking
app.post('/api/bookings/verify', async (req, res) => {
  try {
    const { bookingId, verificationCode } = req.body;

    if (!bookingId || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID and verification code are required'
      });
    }

    // Get stored verification data
    const storedData = verificationCodes.get(bookingId);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired booking session'
      });
    }

    // Check if expired
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(bookingId);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired'
      });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      verificationCodes.delete(bookingId);
      return res.status(400).json({
        success: false,
        error: 'Maximum verification attempts exceeded'
      });
    }

    // Increment attempts
    storedData.attempts++;

    // Verify code
    if (storedData.verificationCode !== verificationCode.toString()) {
      verificationCodes.set(bookingId, storedData);
      return res.status(400).json({
        success: false,
        error: `Invalid verification code. ${3 - storedData.attempts} attempts remaining.`
      });
    }

    // Code is correct - create booking in database
    const booking = await prisma.booking.create({
      data: {
        ...storedData.bookingData,
        status: 'CONFIRMED',
        confirmationCode: generateVerificationCode() // Generate a different code for booking reference
      }
    });

    // Clean up temporary data
    verificationCodes.delete(bookingId);

    // Prepare email data
    const emailData = {
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      confirmationCode: booking.confirmationCode,
      date: booking.date,
      time: booking.time,
      address: booking.address,
      city: booking.city,
      postalCode: booking.postalCode,
      services: JSON.parse(booking.services),
      addOns: booking.extras ? JSON.parse(booking.extras) : [],
      vehicleInfo: `${booking.year} ${booking.make} ${booking.model}`,
      totalPrice: booking.totalPrice,
      specialInstructions: booking.specialInstructions
    };

    // Send emails (don't wait for completion to avoid delays)
    Promise.all([
      // Send confirmation email to customer
      emailService.sendBookingConfirmation(emailData),
      // Send notification email to business
      emailService.sendNewBookingNotification({
        ...emailData,
        phone: booking.phoneNumber
      })
    ]).then(() => {
      // Update email sent status
      prisma.booking.update({
        where: { id: booking.id },
        data: { emailSent: true }
      }).catch(console.error);
    }).catch(error => {
      console.error('Email sending error:', error);
    });

    // Send confirmation SMS
    await twilioClient.messages.create({
      body: `Prime Detailing: Booking confirmed! Reference: #${booking.confirmationCode}. We'll contact you 24hrs before your appointment on ${booking.date.toLocaleDateString()} at ${booking.time}. Check your email for full details.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: booking.phoneNumber
    });

    res.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        date: booking.date,
        time: booking.time,
        services: JSON.parse(booking.services),
        extras: booking.extras ? JSON.parse(booking.extras) : []
      },
      message: 'Booking confirmed successfully'
    });

  } catch (error) {
    console.error('Error verifying booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify booking'
    });
  }
});

// Get booking by confirmation code
app.get('/api/bookings/:confirmationCode', async (req, res) => {
  try {
    const { confirmationCode } = req.params;
    
    const booking = await prisma.booking.findFirst({
      where: {
        confirmationCode: confirmationCode
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phoneNumber: booking.phoneNumber,
        address: booking.address,
        city: booking.city,
        postalCode: booking.postalCode,
        vehicle: `${booking.year} ${booking.make} ${booking.model}`,
        vehicleType: booking.vehicleType,
        services: JSON.parse(booking.services),
        extras: booking.extras ? JSON.parse(booking.extras) : [],
        date: booking.date,
        time: booking.time,
        specialInstructions: booking.specialInstructions,
        totalPrice: booking.totalPrice,
        status: booking.status,
        confirmationCode: booking.confirmationCode,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// NEW: Update booking notes (for detailers)
app.patch('/api/bookings/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // TODO: In production, verify the detailer token here
    // const token = req.header('Authorization')?.replace('Bearer ', '');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { 
        notes: notes || null,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Notes updated successfully',
      booking: {
        id: updatedBooking.id,
        notes: updatedBooking.notes,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating booking notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking notes'
    });
  }
});

// Contact form submission (Updated with email integration)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Store contact submission in database
    const contact = await prisma.contact.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        subject: subject || 'General Inquiry',
        message,
        status: 'NEW'
      }
    });

    // Send notification email to business (don't wait)
    emailService.sendContactFormNotification({
      name,
      email,
      phone,
      subject: subject || 'General Inquiry',
      message
    }).then(() => {
      // Update email sent status
      prisma.contact.update({
        where: { id: contact.id },
        data: { emailSent: true }
      }).catch(console.error);
    }).catch(error => {
      console.error('Contact email error:', error);
    });

    // Optional: Send notification SMS to business owner
    if (process.env.BUSINESS_PHONE) {
      try {
        await twilioClient.messages.create({
          body: `New contact form submission from ${name} (${email}). Subject: ${subject || 'General'}. Message: ${message.substring(0, 100)}...`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.BUSINESS_PHONE
        });
      } catch (smsError) {
        console.error('Contact SMS error:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      contactId: contact.id
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form'
    });
  }
});

// Send booking reminders (can be called via cron job)
app.post('/api/admin/send-reminders', async (req, res) => {
  try {
    // Find bookings for tomorrow that haven't had reminders sent
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: tomorrow,
          lt: nextDay
        },
        reminderSent: false,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS']
        }
      }
    });

    let sentCount = 0;

    for (const booking of bookings) {
      try {
        await emailService.sendBookingReminder({
          firstName: booking.firstName,
          email: booking.email,
          confirmationCode: booking.confirmationCode,
          date: booking.date,
          time: booking.time,
          address: booking.address,
          city: booking.city,
          services: JSON.parse(booking.services)
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true }
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} reminder emails`,
      reminders: sentCount
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminders'
    });
  }
});

// Cleanup expired verification codes (run every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (now > value.expiresAt) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Prime Detailing Backend running on port ${PORT}`);
  console.log(`📱 SMS Mode: Production (Real Twilio)`);
  console.log(`📧 Email Service: ${process.env.EMAIL_USER ? 'Configured' : 'Not Configured'}`);
  console.log(`🔐 Authentication: Phase 3 Ready`);
  console.log(`⚙️  Service Management: Database-Driven Pricing`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});