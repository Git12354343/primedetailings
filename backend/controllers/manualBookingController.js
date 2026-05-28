const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load calendar service safely — won't crash if googleapis not installed
let addBookingToCalendar = null;
try {
  addBookingToCalendar = require('./services/googleCalendar').addBookingToCalendar;
} catch { /* Google Calendar not configured */ }

const generateConfirmationCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/admin/manual-booking — create a booking for a phone client
const createManualBooking = async (req, res) => {
  try {
    const {
      firstName, lastName, phoneNumber, email,
      address, city, postalCode,
      vehicleType, make, model, year,
      services, extras,
      date, time,
      totalPrice, specialInstructions, notes,
      detailerId
    } = req.body;

    // Required fields
    if (!firstName || !lastName || !phoneNumber || !vehicleType || !make || !model || !year || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, phoneNumber, vehicleType, make, model, year, date, time'
      });
    }

    if (!services || services.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service is required' });
    }

    const confirmationCode = generateConfirmationCode();

    const booking = await prisma.booking.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email?.trim() || '',
        address: address?.trim() || 'In-person booking',
        city: city?.trim() || '',
        postalCode: postalCode?.trim() || '',
        vehicleType,
        make,
        model,
        year: parseInt(year),
        services: JSON.stringify(services),
        extras: JSON.stringify(extras || []),
        date: new Date(date.includes('T') ? date : date + 'T12:00:00'),
        time,
        status: 'CONFIRMED',
        confirmationCode,
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        specialInstructions: specialInstructions?.trim() || null,
        notes: notes?.trim() || 'Manual booking — added by admin',
        detailerId: detailerId ? parseInt(detailerId) : null
      }
    });

    // Add to Google Calendar (non-blocking, safe)
    if (addBookingToCalendar) {
      addBookingToCalendar(booking).catch(err => devError.error('Calendar error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Manual booking created successfully',
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        date: booking.date,
        time: booking.time,
        firstName: booking.firstName,
        lastName: booking.lastName,
        phoneNumber: booking.phoneNumber
      }
    });

  } catch (error) {
    devError.error('Create manual booking error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Confirmation code conflict, please try again' });
    }
    res.status(500).json({ success: false, message: 'Error creating manual booking' });
  }
};

module.exports = { createManualBooking };