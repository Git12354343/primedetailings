// backend/server.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');
const emailService = require('./services/emailService');
require('dotenv').config();

// Route handlers
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const serviceRoutes = require('./routes/services');
const availabilityRoutes = require('./routes/availabilityRoutes');

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
// Rate limiting
const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many SMS requests, please try again later'
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many contact submissions, please try again later'
});

app.use('/api/services/active',        publicReadLimiter);
app.use('/api/services/addons/active', publicReadLimiter);
app.use('/api/packages/active',        publicReadLimiter);
app.use('/api/availability',           publicReadLimiter);
app.use('/api/schedule/config',        publicReadLimiter);
app.use('/api/photos',                 publicReadLimiter);
app.use('/api/',                       generalLimiter);
app.use('/api/auth/login',             authLimiter);
app.use('/api/bookings/initiate',      smsLimiter);
app.use('/api/contact',                contactLimiter);

// Routes
app.use('/api/auth', authRoutes);

const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/availability', availabilityRoutes);

const packageRoutes = require('./routes/packages');
app.use('/api/packages', packageRoutes);

const photoRoutes = require('./routes/photos');
app.use('/api/photos', photoRoutes);
app.use('/api/reviews/active', publicReadLimiter);
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

// ADD after existing app.use('/api/availability', availabilityRoutes);
const scheduleRoutes = require('./routes/scheduleRoutes');
const { createManualBooking } = require('./controllers/manualBookingController');

app.use('/api/schedule', scheduleRoutes);
app.post('/api/admin/manual-booking', createManualBooking);

// ─── DB-backed SMS verification codes (uses VerificationCode prisma model) ─────
// Survives server restarts — requires: npx prisma migrate dev

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const storeVerificationCode = async (phone, code, bookingData) => {
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.verificationCode.upsert({
    where: { phoneNumber: phone },
    update: { code, expiresAt: expiry, attempts: 0, bookingData: JSON.stringify(bookingData) },
    create: { phoneNumber: phone, code, expiresAt: expiry, attempts: 0, bookingData: JSON.stringify(bookingData) },
  });
};

const getVerificationCode = async (phone) => {
  try {
    return await prisma.verificationCode.findUnique({ where: { phoneNumber: phone } });
  } catch { return null; }
};

const deleteVerificationCode = async (phone) => {
  try {
    await prisma.verificationCode.delete({ where: { phoneNumber: phone } });
  } catch {}
};

const formatPhoneNumber = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
};

// ─── POST /api/bookings/initiate ─────────────────────────────────────────────
app.post('/api/bookings/initiate', async (req, res) => {
  try {
    const { phoneNumber, bookingData } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const code = generateVerificationCode();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    await storeVerificationCode(formattedPhone, code, bookingData);

    const isDev = process.env.NODE_ENV === 'development';
    let smsSent = false;

    if (!isDev) {
      try {
        await twilioClient.messages.create({
          body: `Your Prestige Plus Detailing verification code is: ${code}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });
        smsSent = true;
      } catch (twilioError) {
        console.error('Twilio error:', twilioError.message);
      }
    } else {
      console.log(`\n📱 DEV MODE — SMS Code for ${formattedPhone}: ${code}\n`);
      smsSent = true;
    }

    res.json({
      success: true,
      message: smsSent ? 'Verification code sent' : 'SMS failed but code generated (check logs)',
      ...(isDev && { devCode: code }),
      phoneNumber: formattedPhone
    });

  } catch (error) {
    console.error('Initiate booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification code' });
  }
});

// ─── POST /api/bookings/verify ───────────────────────────────────────────────
app.post('/api/bookings/verify', async (req, res) => {
  try {
    const { phoneNumber, code, bookingData } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and code are required' });
    }
    

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const stored = await getVerificationCode(formattedPhone);

    if (!stored) {
      return res.status(400).json({ success: false, error: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > new Date(stored.expiresAt)) {
      await deleteVerificationCode(formattedPhone);
      return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
    }

    // Increment attempts in DB
    try {
      await prisma.verificationCode.update({
        where: { phoneNumber: formattedPhone },
        data: { attempts: { increment: 1 } },
      });
    } catch {}
    const updatedAttempts = (stored.attempts || 0) + 1;
    if (updatedAttempts > 3) {
      await deleteVerificationCode(formattedPhone);
      return res.status(400).json({ success: false, error: 'Too many failed attempts. Please request a new code.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
        attemptsRemaining: 3 - updatedAttempts
      });
    }

    // Code is valid — delete from DB and create booking
    await deleteVerificationCode(formattedPhone);
    const finalBookingData = bookingData || (stored.bookingData ? JSON.parse(stored.bookingData) : {});

    // Generate unique confirmation code with retry
    let confirmationCode;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = Math.random().toString(36).substring(2, 8).toUpperCase();
      const exists = await prisma.booking.findUnique({ where: { confirmationCode: candidate } });
      if (!exists) { confirmationCode = candidate; break; }
    }
    if (!confirmationCode) {
      return res.status(500).json({ success: false, error: 'Could not generate unique booking code, please retry.' });
    }

    const booking = await prisma.booking.create({
      data: {
        firstName: finalBookingData.firstName,
        lastName: finalBookingData.lastName,
        phoneNumber: formattedPhone,
        email: finalBookingData.email || '',
        address: finalBookingData.address || '',
        city: finalBookingData.city || '',
        postalCode: finalBookingData.postalCode || '',
        vehicleType: finalBookingData.vehicleType,
        make: finalBookingData.make,
        model: finalBookingData.model,
        year: parseInt(finalBookingData.year),
        services: JSON.stringify(finalBookingData.services || []),
        extras: JSON.stringify(finalBookingData.addOns ?? finalBookingData.extras ?? []),
        date: new Date(finalBookingData.date),
        time: finalBookingData.time,
        status: 'CONFIRMED',
        confirmationCode,
        totalPrice: finalBookingData.totalPrice || null,
        specialInstructions: finalBookingData.specialInstructions || null
      }
    });

    // Add to Google Calendar (non-blocking)
      try {
        const { addBookingToCalendar } = require('./services/googleCalendar');
        addBookingToCalendar(booking).catch(err => console.error('Calendar error:', err));
         } catch {}



    // Send confirmation email if email provided
    if (booking.email) {
      emailService.sendBookingConfirmation({
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        confirmationCode: booking.confirmationCode,
        date: booking.date,
        time: booking.time,
        address: booking.address,
        city: booking.city,
        postalCode: booking.postalCode,
        services: finalBookingData.services || [],
        addOns: finalBookingData.addOns ?? finalBookingData.extras ?? [],
        vehicleInfo: `${booking.year} ${booking.make} ${booking.model}`,
        totalPrice: booking.totalPrice,
        specialInstructions: booking.specialInstructions
      }).catch(err => console.error('Email error:', err));
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        date: booking.date,
        time: booking.time,
        firstName: booking.firstName,
        lastName: booking.lastName
      }
    });

  } catch (error) {
    console.error('Verify booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// ─── GET /api/bookings/:code ──────────────────────────────────────────────────
app.get('/api/bookings/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { confirmationCode: code.toUpperCase() },
      include: {
        detailer: { select: { name: true, phone: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        firstName: booking.firstName,
        lastName: booking.lastName,
        phoneNumber: booking.phoneNumber,
        email: booking.email,
        address: booking.address,
        city: booking.city,
        postalCode: booking.postalCode,
        vehicleType: booking.vehicleType,
        make: booking.make,
        model: booking.model,
        year: booking.year,
        services: typeof booking.services === 'string' ? JSON.parse(booking.services) : booking.services,
        extras: booking.extras ? (typeof booking.extras === 'string' ? JSON.parse(booking.extras) : booking.extras) : [],
        date: booking.date,
        time: booking.time,
        specialInstructions: booking.specialInstructions,
        totalPrice: booking.totalPrice,
        status: booking.status,
        detailer: booking.detailer,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// ─── PATCH /api/bookings/:id/notes ───────────────────────────────────────────
app.patch('/api/bookings/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { notes: notes || null, updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Notes updated successfully',
      booking: { id: updatedBooking.id, notes: updatedBooking.notes, updatedAt: updatedBooking.updatedAt }
    });

  } catch (error) {
    console.error('Error updating booking notes:', error);
    res.status(500).json({ success: false, message: 'Error updating booking notes' });
  }
});

// ─── POST /api/contact ────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Strip HTML tags to prevent XSS stored in DB / sent in emails
    const stripHtml = (str) => String(str || '').replace(/<[^>]*>/g, '').trim();

    const contact = await prisma.contact.create({
      data: {
        name:    stripHtml(name).substring(0, 200),
        email:   email.toLowerCase().trim(),
        phone:   phone ? stripHtml(phone).substring(0, 30) : null,
        subject: stripHtml(subject || 'General Inquiry').substring(0, 200),
        message: stripHtml(message).substring(0, 5000)
      }
    });

    emailService.sendContactNotification?.({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      referenceId: contact.id
    }).catch(err => console.error('Contact email error:', err));

    res.status(201).json({
      success: true,
      message: 'Message received! We will get back to you soon.',
      referenceId: contact.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit contact form' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      database: 'supabase-postgresql',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({ success: false, status: 'unhealthy', error: error.message });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🗄️  Database: Supabase PostgreSQL`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;