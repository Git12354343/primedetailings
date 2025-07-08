// backend/controllers/adminController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Assign booking to detailer
const assignBookingToDetailer = async (req, res) => {
  try {
    const { bookingId, detailerId } = req.body;

    // Validate input
    if (!bookingId || !detailerId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and Detailer ID are required'
      });
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if detailer exists and is active
    const detailer = await prisma.detailer.findUnique({
      where: { id: parseInt(detailerId) }
    });

    if (!detailer) {
      return res.status(404).json({
        success: false,
        message: 'Detailer not found'
      });
    }

    if (!detailer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Detailer is not active'
      });
    }

    // Assign booking to detailer
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        detailerId: parseInt(detailerId),
        status: 'CONFIRMED', // Ensure status is confirmed when assigned
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Booking assigned to ${detailer.name} successfully`,
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        detailerId: updatedBooking.detailerId,
        detailerName: detailer.name,
        status: updatedBooking.status,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error) {
    console.error('Assign booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning booking to detailer'
    });
  }
};

// Get all unassigned bookings
const getUnassignedBookings = async (req, res) => {
  try {
    const unassignedBookings = await prisma.booking.findMany({
      where: {
        detailerId: null,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    res.json({
      success: true,
      bookings: unassignedBookings.map(booking => ({
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
        services: booking.services,
        extras: booking.extras,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        createdAt: booking.createdAt
      }))
    });

  } catch (error) {
    console.error('Get unassigned bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned bookings'
    });
  }
};

// Get all active detailers
const getActiveDetailers = async (req, res) => {
  try {
    const detailers = await prisma.detailer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'IN_PROGRESS']
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      detailers: detailers.map(detailer => ({
        id: detailer.id,
        name: detailer.name,
        email: detailer.email,
        phone: detailer.phone,
        activeBookings: detailer._count.bookings
      }))
    });

  } catch (error) {
    console.error('Get active detailers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active detailers'
    });
  }
};

// Auto-assign booking to available detailer
const autoAssignBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate input
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.detailerId) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already assigned'
      });
    }

    // Find detailer with least bookings on that date
    const detailers = await prisma.detailer.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                date: booking.date,
                status: {
                  in: ['CONFIRMED', 'IN_PROGRESS']
                }
              }
            }
          }
        }
      },
      orderBy: {
        bookings: {
          _count: 'asc'
        }
      }
    });

    if (detailers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active detailers available'
      });
    }

    // Assign to detailer with least bookings
    const selectedDetailer = detailers[0];
    
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        detailerId: selectedDetailer.id,
        status: 'CONFIRMED',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Booking auto-assigned to ${selectedDetailer.name}`,
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        detailerId: updatedBooking.detailerId,
        detailerName: selectedDetailer.name,
        status: updatedBooking.status,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error) {
    console.error('Auto-assign booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-assigning booking'
    });
  }
};

module.exports = {
  assignBookingToDetailer,
  getUnassignedBookings,
  getActiveDetailers,
  autoAssignBooking
};