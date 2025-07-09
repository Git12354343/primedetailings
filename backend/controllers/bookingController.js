// backend/controllers/bookingController.js (Enhanced Version)
const { PrismaClient } = require('@prisma/client');
const { generateConfirmationCode } = require('../utils/helpers');
const { sendBookingConfirmation, sendBookingUpdate } = require('../utils/emailService');

const prisma = new PrismaClient();

// Get assigned bookings for a detailer with pagination
const getAssignedBookings = async (req, res) => {
  try {
    const detailerId = req.detailer.detailerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      detailerId: detailerId,
      status: {
        in: status ? [status] : ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
      }
    };

    // Get total count for pagination
    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      skip,
      take: limit,
      select: {
        id: true,
        confirmationCode: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        address: true,
        city: true,
        vehicleType: true,
        make: true,
        model: true,
        year: true,
        services: true,
        extras: true,
        date: true,
        time: true,
        status: true,
        specialInstructions: true,
        notes: true,
        totalPrice: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        customer: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          phoneNumber: booking.phoneNumber,
          email: booking.email,
          address: booking.address,
          city: booking.city
        },
        vehicle: {
          type: booking.vehicleType,
          make: booking.make,
          model: booking.model,
          year: booking.year
        },
        services: JSON.parse(booking.services || '[]'),
        extras: JSON.parse(booking.extras || '[]'),
        date: booking.date,
        time: booking.time,
        status: booking.status,
        specialInstructions: booking.specialInstructions,
        notes: booking.notes,
        totalPrice: booking.totalPrice ? parseFloat(booking.totalPrice) : null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned bookings'
    });
  }
};

// Create new booking with enhanced validation and pricing calculation
const createBooking = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      city,
      postalCode,
      vehicleType,
      make,
      model,
      year,
      services,
      extras = [],
      date,
      time,
      specialInstructions
    } = req.body;

    // Check for duplicate booking (same customer, date, time)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        email: email.toLowerCase(),
        date: new Date(date),
        time: time,
        status: {
          not: 'CANCELED'
        }
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking at this time slot'
      });
    }

    // Validate services exist and are active
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

    if (serviceRecords.length !== services.length) {
      return res.status(400).json({
        success: false,
        message: 'Some selected services are not available'
      });
    }

    // Calculate total price
    let totalPrice = 0;
    
    // Add service prices
    serviceRecords.forEach(service => {
      const pricing = service.pricing[0];
      if (pricing) {
        totalPrice += parseFloat(pricing.price);
      }
    });

    // Add extra prices if any
    if (extras.length > 0) {
      const extraRecords = await prisma.addOn.findMany({
        where: {
          id: { in: extras.map(id => parseInt(id)) },
          isActive: true
        }
      });

      extraRecords.forEach(extra => {
        totalPrice += parseFloat(extra.price);
      });
    }

    // Generate unique confirmation code
    let confirmationCode;
    let isUnique = false;
    
    while (!isUnique) {
      confirmationCode = generateConfirmationCode();
      const existing = await prisma.booking.findUnique({
        where: { confirmationCode }
      });
      if (!existing) isUnique = true;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        vehicleType,
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        services: JSON.stringify(services),
        extras: JSON.stringify(extras),
        date: new Date(date),
        time,
        specialInstructions: specialInstructions?.trim() || null,
        confirmationCode,
        totalPrice,
        status: 'PENDING'
      }
    });

    // Send confirmation email (async, don't wait)
    sendBookingConfirmation(booking).catch(error => {
      console.error('Email sending failed:', error);
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        customer: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email
        },
        date: booking.date,
        time: booking.time,
        totalPrice: parseFloat(booking.totalPrice),
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
};

// Mark booking as completed with notes
const markBookingCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;
    const detailerId = req.detailer.detailerId;

    // Verify booking belongs to this detailer
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        detailerId: detailerId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not assigned to you'
      });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already completed'
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        status: 'COMPLETED',
        notes: notes?.trim() || booking.notes,
        updatedAt: new Date()
      }
    });

    // Send completion notification email
    sendBookingUpdate(updatedBooking, 'completed').catch(error => {
      console.error('Email sending failed:', error);
    });

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error) {
    console.error('Mark booking completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status'
    });
  }
};

// Update booking status with validation
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;
    const detailerId = req.detailer.detailerId;

    // Validate status transitions
    const validTransitions = {
      'CONFIRMED': ['IN_PROGRESS', 'CANCELED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELED'],
      'COMPLETED': [], // Cannot change from completed
      'CANCELED': [] // Cannot change from canceled
    };

    // Get current booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        detailerId: detailerId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not assigned to you'
      });
    }

    // Check if transition is valid
    const allowedStatuses = validTransitions[booking.status] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        status,
        notes: notes?.trim() || booking.notes,
        updatedAt: new Date()
      }
    });

    // Send status update notification
    sendBookingUpdate(updatedBooking, status.toLowerCase()).catch(error => {
      console.error('Email sending failed:', error);
    });

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status'
    });
  }
};

// Get booking by confirmation code (public endpoint)
const getBookingByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { confirmationCode: code.toUpperCase() },
      include: {
        detailer: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        customer: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          phoneNumber: booking.phoneNumber
        },
        vehicle: {
          type: booking.vehicleType,
          make: booking.make,
          model: booking.model,
          year: booking.year
        },
        services: JSON.parse(booking.services || '[]'),
        extras: JSON.parse(booking.extras || '[]'),
        date: booking.date,
        time: booking.time,
        status: booking.status,
        totalPrice: booking.totalPrice ? parseFloat(booking.totalPrice) : null,
        detailer: booking.detailer,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error('Get booking by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking'
    });
  }
};

module.exports = {
  getAssignedBookings,
  createBooking,
  markBookingCompleted,
  updateBookingStatus,
  getBookingByCode
};