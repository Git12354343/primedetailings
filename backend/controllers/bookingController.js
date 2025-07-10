// backend/controllers/bookingController.js (Complete Fixed Version)
const { PrismaClient } = require('@prisma/client');
const { generateConfirmationCode } = require('../utils/helpers');
const { sendBookingConfirmation, sendBookingUpdate } = require('../utils/emailService');

const prisma = new PrismaClient();

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
        in: status ? [status] : ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
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
        detailerId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get all unique service and add-on IDs from all bookings
    const allServiceIds = new Set();
    const allAddOnIds = new Set();

    bookings.forEach(booking => {
      try {
        const serviceIds = JSON.parse(booking.services || '[]');
        const addOnIds = JSON.parse(booking.extras || '[]');
        
        serviceIds.forEach(id => allServiceIds.add(parseInt(id)));
        addOnIds.forEach(id => allAddOnIds.add(parseInt(id)));
      } catch (error) {
        console.error('Error parsing service/addon IDs for booking', booking.id, error);
      }
    });

    // Fetch all services and add-ons in bulk
    const [allServices, allAddOns] = await Promise.all([
      prisma.service.findMany({
        where: { id: { in: Array.from(allServiceIds) } },
        select: { id: true, name: true }
      }),
      prisma.addOn.findMany({
        where: { id: { in: Array.from(allAddOnIds) } },
        select: { id: true, name: true }
      })
    ]);

    // Create lookup maps for quick access
    const serviceMap = new Map(allServices.map(service => [service.id, service.name]));
    const addOnMap = new Map(allAddOns.map(addOn => [addOn.id, addOn.name]));

    // Helper function to resolve service names
    const resolveServiceNames = (serviceIds) => {
      try {
        const ids = JSON.parse(serviceIds || '[]');
        return ids.map(id => {
          const parsedId = parseInt(id);
          return serviceMap.get(parsedId) || `Service #${id}`;
        });
      } catch (error) {
        console.error('Error resolving service names:', error);
        return [];
      }
    };

    // Helper function to resolve add-on names
    const resolveAddOnNames = (addOnIds) => {
      try {
        const ids = JSON.parse(addOnIds || '[]');
        return ids.map(id => {
          const parsedId = parseInt(id);
          return addOnMap.get(parsedId) || `Add-on #${id}`;
        });
      } catch (error) {
        console.error('Error resolving add-on names:', error);
        return [];
      }
    };

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
        services: resolveServiceNames(booking.services),
        extras: resolveAddOnNames(booking.extras),
        date: booking.date,
        time: booking.time,
        status: booking.status,
        specialInstructions: booking.specialInstructions,
        notes: booking.notes,
        totalPrice: booking.totalPrice ? parseFloat(booking.totalPrice) : null,
        isAssigned: booking.detailerId === detailerId,
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
    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete booking with status ${booking.status}`
      });
    }

    // Prepare update data
    const updateData = {
      status: 'COMPLETED',
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
      data: updateData
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
    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, or CANCELED'
      });
    }

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: parseInt(bookingId)
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
        booking: {
          id: booking.id,
          confirmationCode: booking.confirmationCode,
          status: booking.status,
          notes: booking.notes,
          updatedAt: booking.updatedAt
        }
      });
    }

    // Enhanced status transition validation
    const canTransition = (currentStatus, newStatus) => {
      const transitions = {
        'PENDING': ['CONFIRMED', 'CANCELED'],
        'CONFIRMED': ['IN_PROGRESS', 'CANCELED'],
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
            'CONFIRMED': ['IN_PROGRESS', 'CANCELED'],
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

    // Add notes if provided
    if (typeof notes === 'string') {
      updateData.notes = notes.trim();
    }

    // If booking doesn't have a detailer assigned and status is IN_PROGRESS, assign current detailer
    if (!booking.detailerId && status === 'IN_PROGRESS') {
      updateData.detailerId = detailerId;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: updateData
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

    // Helper function to resolve service names
    const resolveServiceNames = async (serviceIds) => {
      try {
        const ids = JSON.parse(serviceIds || '[]');
        if (ids.length === 0) return [];
        
        const services = await prisma.service.findMany({
          where: { id: { in: ids.map(id => parseInt(id)) } },
          select: { id: true, name: true }
        });
        
        return ids.map(id => {
          const service = services.find(s => s.id === parseInt(id));
          return service ? service.name : `Service #${id}`;
        });
      } catch (error) {
        console.error('Error resolving service names:', error);
        return [];
      }
    };

    // Helper function to resolve add-on names
    const resolveAddOnNames = async (addOnIds) => {
      try {
        const ids = JSON.parse(addOnIds || '[]');
        if (ids.length === 0) return [];
        
        const addOns = await prisma.addOn.findMany({
          where: { id: { in: ids.map(id => parseInt(id)) } },
          select: { id: true, name: true }
        });
        
        return ids.map(id => {
          const addOn = addOns.find(a => a.id === parseInt(id));
          return addOn ? addOn.name : `Add-on #${id}`;
        });
      } catch (error) {
        console.error('Error resolving add-on names:', error);
        return [];
      }
    };

    // Resolve service and add-on names
    const [resolvedServices, resolvedExtras] = await Promise.all([
      resolveServiceNames(booking.services),
      resolveAddOnNames(booking.extras)
    ]);

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
        services: resolvedServices,
        extras: resolvedExtras,
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
      }
    });

    res.json({
      success: true,
      message: 'Notes updated successfully',
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        notes: updatedBooking.notes,
        updatedAt: updatedBooking.updatedAt
      }
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

    // Check database schema
    const tableInfo = await prisma.$queryRaw`DESCRIBE bookings`;
    console.log('Table Schema:', tableInfo);

    res.json({
      success: true,
      debug: {
        booking: booking,
        detailerId: detailerId,
        detailerInfo: req.detailer,
        canAccess: !booking.detailerId || booking.detailerId === detailerId,
        tableSchema: tableInfo,
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