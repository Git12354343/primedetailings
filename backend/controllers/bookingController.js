// backend/controllers/bookingController.js (Enhanced with Availability Integration)
const { PrismaClient } = require('@prisma/client');
const { generateConfirmationCode } = require('../utils/helpers');
const { sendBookingConfirmation, sendBookingUpdate } = require('../utils/emailService');
const { isTimeSlotAvailable, BUSINESS_CONFIG } = require('./availabilityController');

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

// Map frontend time labels to backend time slot IDs
const mapTimeToSlotId = (timeLabel) => {
  const timeSlotMapping = {
    '8:00 AM': 'morning',
    '12:00 PM': 'afternoon'
  };
  return timeSlotMapping[timeLabel];
};

// Enhanced pricing calculation
const calculateBookingPrice = async (services, addOns, vehicleType) => {
  try {
    let totalPrice = 0;
    const breakdown = {
      services: [],
      addOns: [],
      basePrice: 0,
      subtotal: 0,
      total: 0
    };

    // Calculate service prices
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
          const price = parseFloat(pricing.price);
          totalPrice += price;
          breakdown.services.push({
            id: service.id,
            name: service.name,
            price: price
          });
        }
      }
    }

    // Calculate add-on prices
    if (addOns && addOns.length > 0) {
      const addOnRecords = await prisma.addOn.findMany({
        where: {
          id: { in: addOns.map(id => parseInt(id)) },
          isActive: true
        }
      });

      for (const addOn of addOnRecords) {
        const price = parseFloat(addOn.price);
        totalPrice += price;
        breakdown.addOns.push({
          id: addOn.id,
          name: addOn.name,
          price: price
        });
      }
    }

    breakdown.subtotal = totalPrice;
    breakdown.total = totalPrice;

    return breakdown;
  } catch (error) {
    console.error('Error calculating booking price:', error);
    return { total: 0, services: [], addOns: [] };
  }
};

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

// Enhanced booking creation with real-time availability checking
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
      addOns = [],
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

    // NEW: Validate time slot availability in real-time
    const timeSlotId = mapTimeToSlotId(time);
    if (!timeSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot selected'
      });
    }

    const availability = await isTimeSlotAvailable(date, timeSlotId);
    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: `Time slot unavailable: ${availability.reason}`,
        availabilityError: true,
        suggestedAction: 'Please select a different date or time'
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

    // NEW: Calculate accurate pricing using database services
    const pricingBreakdown = await calculateBookingPrice(services, addOns, vehicleType);
    const totalPrice = pricingBreakdown.total;

    // Calculate estimated duration
    let estimatedDuration = BUSINESS_CONFIG.serviceDuration; // Base duration
    if (addOns && addOns.length > 0) {
      estimatedDuration += addOns.length * 0.5; // 30 minutes per add-on
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
        extras: JSON.stringify(addOns || []),
        date: new Date(date),
        time,
        specialInstructions: specialInstructions?.trim() || null,
        confirmationCode,
        totalPrice,
        estimatedDuration,
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
      booking: formatBookingData(booking),
      pricingBreakdown,
      estimatedDuration: `${estimatedDuration} hours`
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

    // Parse and resolve services and add-ons IDs to names
    let resolvedServices = [];
    let resolvedAddOns = [];
    
    try {
      // Parse services - handle both array and JSON string
      let serviceIds = [];
      if (typeof booking.services === 'string') {
        serviceIds = JSON.parse(booking.services || '[]');
      } else if (Array.isArray(booking.services)) {
        serviceIds = booking.services;
      }

      // Check if services are IDs (numbers) or already names (strings)
      const servicesAreIds = serviceIds.length > 0 && serviceIds.every(item => 
        !isNaN(parseInt(item)) || typeof item === 'number'
      );

      if (servicesAreIds && serviceIds.length > 0) {
        // Fetch service names from database
        const services = await prisma.service.findMany({
          where: {
            id: { in: serviceIds.map(id => parseInt(id)) }
          },
          select: { id: true, name: true }
        });
        
        // Map IDs to names, preserve order
        resolvedServices = serviceIds.map(id => {
          const service = services.find(s => s.id === parseInt(id));
          return service ? service.name : `Unknown Service (ID: ${id})`;
        });
      } else {
        // Already names, use directly
        resolvedServices = serviceIds;
      }
    } catch (error) {
      console.error('Error parsing/resolving services:', error);
      resolvedServices = [];
    }

    try {
      // Parse add-ons - handle both array and JSON string
      let addOnIds = [];
      if (typeof booking.extras === 'string') {
        addOnIds = JSON.parse(booking.extras || '[]');
      } else if (Array.isArray(booking.extras)) {
        addOnIds = booking.extras;
      }

      // Check if add-ons are IDs (numbers) or already names (strings)
      const addOnsAreIds = addOnIds.length > 0 && addOnIds.every(item => 
        !isNaN(parseInt(item)) || typeof item === 'number'
      );

      if (addOnsAreIds && addOnIds.length > 0) {
        // Fetch add-on names from database
        const addOns = await prisma.addOn.findMany({
          where: {
            id: { in: addOnIds.map(id => parseInt(id)) }
          },
          select: { id: true, name: true }
        });
        
        // Map IDs to names, preserve order
        resolvedAddOns = addOnIds.map(id => {
          const addOn = addOns.find(a => a.id === parseInt(id));
          return addOn ? addOn.name : `Unknown Add-on (ID: ${id})`;
        });
      } else {
        // Already names, use directly
        resolvedAddOns = addOnIds;
      }
    } catch (error) {
      console.error('Error parsing/resolving add-ons:', error);
      resolvedAddOns = [];
    }

    // Format the booking data and add resolved services/add-ons
    const formattedBooking = formatBookingData(booking);
    
    res.json({
      success: true,
      booking: {
        ...formattedBooking,
        resolvedServices,
        resolvedAddOns
      }
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