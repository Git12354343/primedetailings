// backend/controllers/bookingController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get assigned bookings for a detailer
const getAssignedBookings = async (req, res) => {
  try {
    const detailerId = req.detailer.detailerId;

    const bookings = await prisma.booking.findMany({
      where: {
        detailerId: detailerId,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
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
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }))
    });

  } catch (error) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned bookings'
    });
  }
};

// Mark booking as completed
const markBookingCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const detailerId = req.detailer.detailerId;

    // First, verify the booking belongs to this detailer
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

    // Update booking status to COMPLETED
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        status: updatedBooking.status,
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

// Update booking status (general purpose)
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const detailerId = req.detailer.detailerId;

    // Validate status
    const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: CONFIRMED, IN_PROGRESS, or COMPLETED'
      });
    }

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

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        status: status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: {
        id: updatedBooking.id,
        confirmationCode: updatedBooking.confirmationCode,
        status: updatedBooking.status,
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

module.exports = {
  getAssignedBookings,
  markBookingCompleted,
  updateBookingStatus
};