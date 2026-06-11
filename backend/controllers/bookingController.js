/**
 * bookingController.js
 *
 * Changes from original:
 *  - createBooking  → all creation goes through createBookingAtomic
 *  - rescheduleBooking → uses getBookingStartAt to fix the NaN cutoff bug
 *  - cancelBooking     → same fix
 *  - BUSINESS_CONFIG import removed (was not exported; caused silent undefined)
 *  - mapTimeToSlotId kept for display/legacy but slotId is the scheduling key
 *  - estimatedDuration calculation units fixed (hours → minutes)
 */

'use strict';

const { PrismaClient }                           = require('@prisma/client');
const emailService                               = require('../services/emailService');
const { sms }                                    = require('../services/smsService');
const { audit, getIp }                           = require('../services/auditService');
const { generateBookingIcs }                     = require('../services/icsService');
const {
  createBookingAtomic,
  BookingConflictError,
  resolveSlotId,
  getBookingStartAt,
}                                                = require('../services/bookingAtomic');
const { isTimeSlotAvailable, loadConfig }        = require('./availabilityController');

const prisma = new PrismaClient();

// Email helpers — safe wrappers
const sendBookingConfirmation = (booking) =>
  emailService.sendBookingConfirmation(booking).catch(e => console.error('Confirmation email failed:', e));
const sendBookingUpdate = (booking, status) => {
  if (typeof emailService.sendBookingUpdate === 'function') {
    return emailService.sendBookingUpdate(booking, status).catch(e => console.error('Update email failed:', e));
  }
  return Promise.resolve();
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatBookingData = (booking) => ({
  id:                  booking.id,
  confirmationCode:    booking.confirmationCode,
  customer: {
    firstName:   booking.firstName   || 'Unknown',
    lastName:    booking.lastName    || '',
    phoneNumber: booking.phoneNumber || 'Unknown',
    email:       booking.email       || '',
    address:     booking.address     || 'Unknown',
    city:        booking.city        || '',
    postalCode:  booking.postalCode  || '',
  },
  vehicle: {
    type:      booking.vehicleType       || 'Unknown',
    make:      booking.make              || 'Unknown',
    model:     booking.model             || '',
    year:      booking.year              || null,
    condition: booking.vehicleCondition  || '',
  },
  propertyType:        booking.propertyType   || '',
  hasWaterPower:       booking.hasWaterPower,
  services:            booking.services       || '[]',
  extras:              booking.extras         || '[]',
  date:                booking.date,
  time:                booking.time,
  slotId:              booking.slotId,
  startAt:             booking.startAt,
  endAt:               booking.endAt,
  status:              booking.status,
  detailerId:          booking.detailerId,
  detailer:            booking.detailer ? {
    id:    booking.detailer.id,
    name:  booking.detailer.name,
    email: booking.detailer.email,
    phone: booking.detailer.phone,
  } : null,
  specialInstructions: booking.specialInstructions,
  notes:               booking.notes,
  totalPrice:          booking.totalPrice ? parseFloat(booking.totalPrice) : null,
  estimatedDuration:   booking.estimatedDuration,
  enRouteAt:           booking.enRouteAt,
  startedAt:           booking.startedAt,
  arrivedAt:           booking.arrivedAt,
  completedAt:         booking.completedAt,
  createdAt:           booking.createdAt,
  updatedAt:           booking.updatedAt,
});

// Map time label to slot id — still used for legacy requests and display
const mapTimeToSlotId = async (timeLabel) => resolveSlotId(timeLabel);

// Enhanced pricing calculation (unchanged from original)
const calculateBookingPrice = async (services, addOns, vehicleType) => {
  try {
    let totalPrice = 0;
    const breakdown = { services: [], addOns: [], subtotal: 0, total: 0 };

    if (services?.length) {
      const serviceRecords = await prisma.service.findMany({
        where: { id: { in: services.map(id => parseInt(id)) }, isActive: true },
        include: { pricing: { where: { vehicleType } } },
      });
      for (const service of serviceRecords) {
        const price = parseFloat(service.pricing[0]?.price || 0);
        totalPrice += price;
        breakdown.services.push({ id: service.id, name: service.name, price });
      }
    }

    if (addOns?.length) {
      const addOnRecords = await prisma.addOn.findMany({
        where: { id: { in: addOns.map(id => parseInt(id)) }, isActive: true },
      });
      for (const addOn of addOnRecords) {
        const price = parseFloat(addOn.price);
        totalPrice += price;
        breakdown.addOns.push({ id: addOn.id, name: addOn.name, price });
      }
    }

    breakdown.subtotal = totalPrice;
    breakdown.total    = totalPrice;
    return breakdown;
  } catch (error) {
    console.error('Error calculating booking price:', error);
    return { total: 0, services: [], addOns: [] };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get assigned bookings for a detailer (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const getAssignedBookings = async (req, res) => {
  try {
    const detailerId = req.detailer?.detailerId;
    if (!detailerId) {
      return res.status(401).json({ success: false, message: 'Invalid detailer authentication' });
    }

    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip   = (page - 1) * limit;

    const where = {
      detailerId,
      status: {
        in: status
          ? [status]
          : ['PENDING', 'CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED'],
      },
    };

    const total    = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      include: { detailer: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: [{ startAt: 'asc' }, { date: 'asc' }, { time: 'asc' }],
      skip,
      take: limit,
    });

    res.json({
      success: true,
      bookings: bookings.map(b => ({ ...formatBookingData(b), isAssigned: b.detailerId === detailerId })),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching assigned bookings' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Create booking (customer route — also called from SMS-verify path)
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phoneNumber,
      address, city, postalCode,
      vehicleType, make, model, year,
      services, addOns = [],
      date, time, slotId: rawSlotId,
      specialInstructions,
      vehicleCondition, propertyType, hasWaterPower,
      packageId,
    } = req.body;

    // Input validation
    if (!firstName || !lastName || !email || !phoneNumber || !address || !city || !postalCode) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }
    if (!vehicleType || !make || !model || !year) {
      return res.status(400).json({ success: false, message: 'Vehicle information is required' });
    }
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service must be selected' });
    }
    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required' });
    }

    // Resolve slotId from either explicit slotId or the display label
    const slotId = rawSlotId || await resolveSlotId(time);
    if (!slotId) {
      return res.status(400).json({ success: false, message: 'Invalid time slot selected' });
    }

    // Calculate pricing
    const pricingBreakdown    = await calculateBookingPrice(services, addOns, vehicleType);
    const totalPrice          = pricingBreakdown.total;

    // Duration: sum service durations from DB
    const config              = await loadConfig();
    const durationMinutes     = (config.serviceDuration || 4) * 60
                                + (addOns.length * 30); // 30 min per add-on

    try {
      const booking = await createBookingAtomic({
        date, slotId, time,
        firstName, lastName, email, phoneNumber,
        address, city, postalCode,
        vehicleType, vehicleCondition, make, model, year,
        propertyType, hasWaterPower,
        services:    JSON.stringify(services),
        extras:      JSON.stringify(addOns),
        totalPrice,
        estimatedDuration: durationMinutes,
        specialInstructions,
        packageId,
      }, { initiatedBy: 'customer', status: 'PENDING' });

      // Non-blocking side-effects
      sendBookingConfirmation(booking).catch(() => {});
      sms.bookingConfirmed(booking).catch(() => {});

      res.status(201).json({
        success: true,
        booking: formatBookingData(booking),
        confirmationCode: booking.confirmationCode,
      });
    } catch (err) {
      if (err instanceof BookingConflictError) {
        return res.status(409).json({
          success: false,
          message:          err.message,
          availabilityError: true,
          conflictCode:     err.conflictCode,
          suggestedAction:  'Please select a different date or time',
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ success: false, message: 'Error creating booking' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Reschedule booking
// Fix: use getBookingStartAt() so the cutoff isn't NaN
// ─────────────────────────────────────────────────────────────────────────────
const rescheduleBooking = async (req, res) => {
  try {
    const { code }                          = req.params;
    const { date, time, slotId: rawSlotId, adminOverride } = req.body;

    if (!code)        return res.status(400).json({ success: false, message: 'Confirmation code is required' });
    if (!date || !time) return res.status(400).json({ success: false, message: 'New date and time are required' });

    const booking = await prisma.booking.findUnique({ where: { confirmationCode: code.toUpperCase() } });
    if (!booking)  return res.status(404).json({ success: false, message: 'Booking not found' });
    if (['COMPLETED', 'CANCELED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot reschedule a ${booking.status.toLowerCase()} booking` });
    }

    // ── 24-hour policy (cutoff math FIXED using startAt) ─────────────────────
    if (!adminOverride) {
      const cutoffHours = parseInt(process.env.CANCEL_CUTOFF_HOURS || '24');
      const bookingStart = await getBookingStartAt(booking);
      if (bookingStart) {
        const hoursUntil = (bookingStart.getTime() - Date.now()) / 3_600_000;
        if (hoursUntil < cutoffHours) {
          return res.status(400).json({
            success: false,
            message: `Free rescheduling is no longer available (less than ${cutoffHours}h before your appointment). Please call (438) 796-8001.`,
            policyViolation: true,
          });
        }
      }
    }

    // Resolve new slot
    const newSlotId = rawSlotId || await resolveSlotId(time);
    if (!newSlotId) return res.status(400).json({ success: false, message: 'Invalid time slot selected' });

    // Check new slot availability (exclude current booking)
    const availability = await isTimeSlotAvailable(date, newSlotId, { excludeBookingId: booking.id });
    if (!availability.available && !adminOverride) {
      return res.status(409).json({
        success: false,
        message: `Time slot unavailable: ${availability.reason}`,
        availabilityError: true,
      });
    }

    // Compute new startAt / endAt
    const { computeStartAt, computeEndAt } = require('../services/bookingAtomic');
    const config    = await loadConfig();
    const slotCfg   = config.timeSlots.find(s => s.id === newSlotId);
    const newStart  = computeStartAt(date, slotCfg.startHour);
    const newEnd    = computeEndAt(newStart, booking.estimatedDuration || (config.serviceDuration || 4) * 60, (config.bufferTime || 0.5) * 60);

    const updated = await prisma.booking.update({
      where: { confirmationCode: code.toUpperCase() },
      data: {
        date:    new Date(date + 'T12:00:00'),
        time,
        slotId:  newSlotId,
        startAt: newStart,
        endAt:   newEnd,
        updatedAt: new Date(),
      },
    });

    // History + notifications
    await prisma.bookingHistory.create({
      data: {
        bookingId:  booking.id,
        action:     'RESCHEDULED',
        oldDate:    booking.date,
        newDate:    new Date(date + 'T12:00:00'),
        oldTime:    booking.time,
        newTime:    time,
        initiatedBy: adminOverride ? 'admin' : 'customer',
      },
    }).catch(() => {});

    sms.bookingRescheduled({ ...updated, firstName: updated.firstName }).catch(() => {});
    audit('booking', booking.id, 'rescheduled',
      { date: booking.date, time: booking.time },
      { date, time, slotId: newSlotId },
      getIp(req)
    );

    res.json({ success: true, message: 'Booking rescheduled successfully', booking: formatBookingData(updated) });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ success: false, message: 'Error rescheduling booking' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Cancel booking
// Fix: same NaN cutoff fix
// ─────────────────────────────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const { code }                   = req.params;
    const { reason, adminOverride }  = req.body;

    if (!code) return res.status(400).json({ success: false, message: 'Confirmation code is required' });

    const booking = await prisma.booking.findUnique({ where: { confirmationCode: code.toUpperCase() } });
    if (!booking)                     return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'CANCELED') return res.status(400).json({ success: false, message: 'Booking is already canceled' });
    if (booking.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });

    // ── 24-hour cancellation policy (FIXED) ──────────────────────────────────
    if (!adminOverride) {
      const cutoffHours  = parseInt(process.env.CANCEL_CUTOFF_HOURS || '24');
      const bookingStart = await getBookingStartAt(booking);
      if (bookingStart) {
        const hoursUntil = (bookingStart.getTime() - Date.now()) / 3_600_000;
        if (hoursUntil < cutoffHours) {
          return res.status(400).json({
            success: false,
            message: `Free cancellation is no longer available (less than ${cutoffHours}h before your appointment). Please call (438) 796-8001.`,
            policyViolation: true,
          });
        }
      }
    }

    const updated = await prisma.booking.update({
      where: { confirmationCode: code.toUpperCase() },
      data: {
        status:             'CANCELED',
        cancellationReason: reason || null,
        updatedAt:          new Date(),
      },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId:   booking.id,
        action:      'CANCELED',
        oldStatus:   booking.status,
        newStatus:   'CANCELED',
        reason:      reason || null,
        initiatedBy: adminOverride ? 'admin' : 'customer',
      },
    }).catch(() => {});

    sms.bookingCanceled?.({ ...updated, firstName: updated.firstName }).catch(() => {});
    audit('booking', booking.id, 'canceled',
      { status: booking.status },
      { status: 'CANCELED', reason },
      getIp(req)
    );

    res.json({ success: true, message: 'Booking canceled successfully', booking: formatBookingData(updated) });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Error canceling booking' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get booking by confirmation code (public)
// ─────────────────────────────────────────────────────────────────────────────
const getBookingByCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ success: false, message: 'Confirmation code is required' });

    const booking = await prisma.booking.findUnique({
      where:   { confirmationCode: code.toUpperCase() },
      include: { detailer: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, booking: formatBookingData(booking) });
  } catch (error) {
    console.error('Get booking by code error:', error);
    res.status(500).json({ success: false, message: 'Error fetching booking' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Mark booking completed (detailer route)
// ─────────────────────────────────────────────────────────────────────────────
const markBookingCompleted = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes }     = req.body;
    const detailerId    = req.detailer?.detailerId;

    if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID is required' });

    const booking = await prisma.booking.findUnique({
      where:   { id: parseInt(bookingId) },
      include: { detailer: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data:  {
        status:      'COMPLETED',
        completedAt: new Date(),
        updatedAt:   new Date(),
        ...(typeof notes === 'string' && { notes: notes.trim() }),
      },
      include: { detailer: true },
    });

    sendBookingUpdate(updatedBooking, 'completed').catch(() => {});
    audit('booking', booking.id, 'completed', { status: booking.status }, { status: 'COMPLETED' }, getIp(req));

    res.json({ success: true, message: 'Booking marked as completed', booking: formatBookingData(updatedBooking) });
  } catch (error) {
    console.error('Mark completed error:', error);
    res.status(500).json({ success: false, message: 'Error marking booking as completed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update booking status (unchanged logic, keeping all transitions)
// ─────────────────────────────────────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes }  = req.body;
    const detailerId    = req.detailer?.detailerId;

    if (!bookingId || !status) {
      return res.status(400).json({ success: false, message: 'Booking ID and status are required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { detailer: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const transitions = {
      PENDING:     ['CONFIRMED', 'CANCELED'],
      CONFIRMED:   ['EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'],
      EN_ROUTE:    ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'],
      STARTED:     ['IN_PROGRESS', 'COMPLETED', 'CANCELED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELED'],
      COMPLETED:   [],
      CANCELED:    [],
    };

    if (!transitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`,
        allowedTransitions: transitions[booking.status] || [],
      });
    }

    const updateData = { status, updatedAt: new Date() };
    if (status === 'EN_ROUTE')   updateData.enRouteAt   = new Date();
    if (status === 'STARTED')    updateData.startedAt   = new Date();
    if (status === 'COMPLETED')  updateData.completedAt = new Date();
    if (typeof notes === 'string') updateData.notes = notes.trim();
    if (!booking.detailerId && ['EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status) && detailerId) {
      updateData.detailerId = detailerId;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data:  updateData,
      include: { detailer: true },
    });

    sendBookingUpdate(updatedBooking, status.toLowerCase()).catch(() => {});

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: formatBookingData(updatedBooking),
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Error updating booking status' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update booking notes (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const updateBookingNotes = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes }     = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID is required' });

    const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data:  { notes: typeof notes === 'string' ? notes.trim() : '', updatedAt: new Date() },
      include: { detailer: true },
    });

    res.json({ success: true, message: 'Notes updated successfully', booking: formatBookingData(updatedBooking) });
  } catch (error) {
    console.error('Update booking notes error:', error);
    res.status(500).json({ success: false, message: 'Error updating notes' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Resend confirmation email (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const resendConfirmationEmail = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ success: false, message: 'Confirmation code is required' });
    const booking = await prisma.booking.findUnique({ where: { confirmationCode: code.toUpperCase() } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    await sendBookingConfirmation(booking);
    res.json({ success: true, message: 'Confirmation email resent successfully' });
  } catch (error) {
    console.error('Resend confirmation email error:', error);
    res.status(500).json({ success: false, message: 'Error resending confirmation email' });
  }
};

module.exports = {
  getAssignedBookings,
  createBooking,
  markBookingCompleted,
  updateBookingStatus,
  updateBookingNotes,
  getBookingByCode,
  rescheduleBooking,
  cancelBooking,
  resendConfirmationEmail,
  formatBookingData,
};
