// backend/controllers/bookingController.js (COMPLETE FIXED VERSION)
const { PrismaClient } = require('@prisma/client');
const { generateConfirmationCode } = require('../utils/helpers');
const { sendBookingConfirmation, sendBookingUpdate } = require('../utils/emailService');

const prisma = new PrismaClient();

// Helper function to format booking data consistently
const formatBookingData = (booking) => ({
  id: booking.id,
  confirmationCode: booking.confirmationCode,
  customer: {
    firstName: booking.firstName || 'Unknown',
    lastName: booking.lastName || '',
    phoneNumber: booking.phoneNumber || 'Unknown',
    email: booking.email || '',
    address: booking.address || 'Unknown',
    city: booking.city || '',
    postalCode: booking.postalCode || ''
  },
  vehicle: {
    type: booking.vehicleType || 'Unknown',
    make: booking.make || 'Unknown',
    model: booking.model || '',
    year: booking.year || null
  },
  services: booking.services || '[]',
  extras: booking.extras || '[]',
  date: booking.date,
  time: booking.time,
  status: booking.status,
  detailerId: booking.detailerId,
  detailer: booking.detailer ? {
    id: booking.detailer.id,
    name: booking.detailer.name,
    email: booking.detailer.email,
    phone: booking.detailer.phone
  } : null,
  specialInstructions: booking.specialInstructions,
  notes: booking.notes,
  totalPrice: booking.totalPrice ? parseFloat(booking.totalPrice) : null,
  enRouteAt: booking.enRouteAt,
  startedAt: booking.startedAt,
  arrivedAt: booking.arrivedAt,
  completedAt: booking.completedAt,
  estimatedDuration: booking.estimatedDuration,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

// Get assigned bookings for a detailer with pagination
const getAssignedBookings = async (req, res) => {
  try {
    const detailerId = req.detailer?.detailerId;
    
    if (!detailerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid detailer authentication'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    // Build where clause - show bookings assigned to this detailer OR unassigned bookings
    const where = {
      OR: [
        { detailerId: detailerId },
        { detailerId: null } // Show unassigned bookings too
      ],
      status: {
        in: status ? [status] : ['PENDING', 'CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED']
      }
    };

    // Get total count for pagination
    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        detailer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      skip,
      take: limit
    });

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
        ...formatBookingData(booking),
        isAssigned: booking.detailerId === detailerId
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
      message: 'Error fetching assigned bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Input validation
    if (!firstName || !lastName || !email || !phoneNumber || !address || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (!vehicleType || !make || !model || !year) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle information is required'
      });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service must be selected'
      });
    }

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

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

    // Calculate total price (simplified - you can enhance this)
    let totalPrice = 0;
    
    // For now, use a simple calculation - you can make this more sophisticated
    const basePrice = vehicleType === 'Sedan' ? 100 : 
                     vehicleType === 'SUV' ? 120 : 
                     vehicleType === 'Truck' ? 140 : 110;
    
    totalPrice = basePrice * services.length;
    
    if (Array.isArray(extras)) {
      totalPrice += extras.length * 25; // $25 per add-on
    }

    // Generate unique confirmation code
    let confirmationCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      confirmationCode = generateConfirmationCode();
      const existing = await prisma.booking.findUnique({
        where: { confirmationCode }
      });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate unique confirmation code'
      });
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
        extras: JSON.stringify(extras || []),
        date: new Date(date),
        time,
        specialInstructions: specialInstructions?.trim() || null,
        confirmationCode,
        totalPrice,
        status: 'PENDING'
      }
    });

    // Send confirmation email (async, don't wait)
    if (sendBookingConfirmation) {
      sendBookingConfirmation(booking).catch(error => {
        console.error('Email sending failed:', error);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: formatBookingData(booking)
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark booking as completed with notes
const markBookingCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;
    const detailerId = req.detailer?.detailerId;

    // Validation
    if (!detailerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid detailer authentication'
      });
    }

    if (!bookingId || isNaN(parseInt(bookingId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: parseInt(bookingId)
      },
      include: {
        detailer: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is assigned to this detailer (if detailerId field exists)
    // If detailerId is null, allow any authenticated detailer to complete it
    if (booking.detailerId && booking.detailerId !== detailerId) {
      return res.status(403).json({
        success: false,
        message: 'Booking not assigned to you'
      });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already completed'
      });
    }

    // Check if booking can be completed
    if (!['PENDING', 'CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete booking with status ${booking.status}`
      });
    }

    // Prepare update data
    const updateData = {
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedAt: new Date()
    };

    // Add notes if provided
    if (typeof notes === 'string') {
      updateData.notes = notes.trim();
    }

    // If booking doesn't have a detailer assigned, assign current detailer
    if (!booking.detailerId) {
      updateData.detailerId = detailerId;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: updateData,
      include: {
        detailer: true
      }
    });

    // Send completion notification email
    if (sendBookingUpdate) {
      sendBookingUpdate(updatedBooking, 'completed').catch(error => {
        console.error('Email sending failed:', error);
      });
    }

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      booking: formatBookingData(updatedBooking)
    });

  } catch (error) {
    console.error('Mark booking completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking status with validation
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes, location } = req.body;
    const detailerId = req.detailer?.detailerId;

    // Enhanced validation
    if (!detailerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid detailer authentication'
      });
    }

    if (!bookingId || isNaN(parseInt(bookingId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: PENDING, CONFIRMED, EN_ROUTE, STARTED, IN_PROGRESS, COMPLETED, or CANCELED'
      });
    }

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: parseInt(bookingId)
      },
      include: {
        detailer: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is assigned to this detailer (if detailerId field exists)
    if (booking.detailerId && booking.detailerId !== detailerId) {
      return res.status(403).json({
        success: false,
        message: 'Booking not assigned to you'
      });
    }

    // Check if the status is actually changing
    if (booking.status === status) {
      return res.json({
        success: true,
        message: `Booking is already ${status}`,
        booking: formatBookingData(booking)
      });
    }

    // Enhanced status transition validation
    const canTransition = (currentStatus, newStatus) => {
      const transitions = {
        'PENDING': ['CONFIRMED', 'CANCELED'],
        'CONFIRMED': ['EN_ROUTE', 'CANCELED'],
        'EN_ROUTE': ['STARTED', 'CANCELED'],
        'STARTED': ['IN_PROGRESS', 'CANCELED'],
        'IN_PROGRESS': ['COMPLETED', 'CANCELED'],
        'COMPLETED': [], // Cannot change from completed
        'CANCELED': [] // Cannot change from canceled
      };
      
      return transitions[currentStatus]?.includes(newStatus) || false;
    };

    // Check if transition is valid
    if (!canTransition(booking.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`,
        allowedTransitions: (() => {
          const transitions = {
            'PENDING': ['CONFIRMED', 'CANCELED'],
            'CONFIRMED': ['EN_ROUTE', 'CANCELED'],
            'EN_ROUTE': ['STARTED', 'CANCELED'],
            'STARTED': ['IN_PROGRESS', 'CANCELED'],
            'IN_PROGRESS': ['COMPLETED', 'CANCELED'],
            'COMPLETED': [],
            'CANCELED': []
          };
          return transitions[booking.status] || [];
        })()
      });
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Add timestamp fields based on status
    switch (status) {
      case 'EN_ROUTE':
        updateData.enRouteAt = new Date();
        break;
      case 'STARTED':
        updateData.startedAt = new Date();
        break;
      case 'COMPLETED':
        updateData.completedAt = new Date();
        break;
    }

    // Add notes if provided
    if (typeof notes === 'string') {
      updateData.notes = notes.trim();
    }

    // If booking doesn't have a detailer assigned and status is progressing, assign current detailer
    if (!booking.detailerId && ['EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      updateData.detailerId = detailerId;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: updateData,
      include: {
        detailer: true
      }
    });

    // Send status update notification
    if (sendBookingUpdate) {
      sendBookingUpdate(updatedBooking, status.toLowerCase()).catch(error => {
        console.error('Email sending failed:', error);
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: formatBookingData(updatedBooking)
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get booking by confirmation code (public endpoint)
const getBookingByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation code is required'
      });
    }

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
      booking: formatBookingData(booking)
    });

  } catch (error) {
    console.error('Get booking by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking notes (separate endpoint for just notes)
const updateBookingNotes = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;
    const detailerId = req.detailer?.detailerId;

    // Validation
    if (!detailerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid detailer authentication'
      });
    }

    if (!bookingId || isNaN(parseInt(bookingId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: parseInt(bookingId)
      },
      include: {
        detailer: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is assigned to this detailer (if detailerId field exists)
    if (booking.detailerId && booking.detailerId !== detailerId) {
      return res.status(403).json({
        success: false,
        message: 'Booking not assigned to you'
      });
    }

    // Update only notes
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        notes: typeof notes === 'string' ? notes.trim() : '',
        updatedAt: new Date()
      },
      include: {
        detailer: true
      }
    });

    res.json({
      success: true,
      message: 'Notes updated successfully',
      booking: formatBookingData(updatedBooking)
    });

  } catch (error) {
    console.error('Update booking notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Debug endpoint for troubleshooting
const debugBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const detailerId = req.detailer?.detailerId;

    console.log('=== DEBUG BOOKING ===');
    console.log('Booking ID:', bookingId, 'Type:', typeof bookingId);
    console.log('Detailer ID:', detailerId, 'Type:', typeof detailerId);
    console.log('Detailer Info:', req.detailer);

    // Get the booking with all fields
    const booking = await prisma.booking.findUnique({
      where: {
        id: parseInt(bookingId)
      },
      include: {
        detailer: true
      }
    });

    console.log('Found Booking:', booking);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        debug: {
          bookingId: parseInt(bookingId),
          detailerId: detailerId,
          parsedBookingId: parseInt(bookingId),
          isNaN: isNaN(parseInt(bookingId))
        }
      });
    }

    res.json({
      success: true,
      debug: {
        booking: formatBookingData(booking),
        rawBooking: booking,
        detailerId: detailerId,
        detailerInfo: req.detailer,
        canAccess: !booking.detailerId || booking.detailerId === detailerId,
        bookingHasDetailerId: booking.hasOwnProperty('detailerId'),
        detailerIdValue: booking.detailerId,
        detailerIdType: typeof booking.detailerId
      }
    });

  } catch (error) {
    console.error('Debug booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getAssignedBookings,
  createBooking,
  markBookingCompleted,
  updateBookingStatus,
  getBookingByCode,
  updateBookingNotes,
  debugBooking
};