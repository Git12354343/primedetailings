/**
 * manualBookingController.js
 *
 * Changes from original:
 *  - Uses createBookingAtomic() — no more bare prisma.booking.create
 *  - Checks for conflicts before creating; returns conflicting code to the UI
 *  - override:true bypasses the conflict block but records it in AuditLog
 *  - Validation requires a valid slotId or recognisable time label
 */

'use strict';

const { createBookingAtomic, BookingConflictError, resolveSlotId } = require('../services/bookingAtomic');
const { audit, getIp } = require('../services/auditService');

// POST /api/admin/manual-booking
const createManualBooking = async (req, res) => {
  try {
    const {
      firstName, lastName, phoneNumber, email,
      address, city, postalCode,
      vehicleType, vehicleCondition, make, model, year,
      services, extras,
      date, time, slotId: rawSlotId,
      totalPrice, specialInstructions, notes,
      detailerId,
      override = false,   // admin can pass override:true to proceed past conflicts
    } = req.body;

    // ── Required field validation ────────────────────────────────────────────
    const missing = [];
    if (!firstName)   missing.push('firstName');
    if (!lastName)    missing.push('lastName');
    if (!phoneNumber) missing.push('phoneNumber');
    if (!vehicleType) missing.push('vehicleType');
    if (!make)        missing.push('make');
    if (!model)       missing.push('model');
    if (!year)        missing.push('year');
    if (!date)        missing.push('date');
    if (!time)        missing.push('time');
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    if (!services || services.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one service is required' });
    }

    // ── Resolve slotId ───────────────────────────────────────────────────────
    const slotId = rawSlotId || await resolveSlotId(time);
    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: `"${time}" does not match any configured time slot. Use the slot picker.`,
      });
    }

    // ── Create atomically ────────────────────────────────────────────────────
    try {
      const booking = await createBookingAtomic({
        date, slotId, time,
        firstName, lastName, phoneNumber, email: email || '',
        address:  address  || 'In-person booking',
        city:     city     || '',
        postalCode: postalCode || '',
        vehicleType, vehicleCondition: vehicleCondition || '',
        make, model, year,
        services: JSON.stringify(services),
        extras:   JSON.stringify(extras || []),
        totalPrice,
        specialInstructions,
        notes: notes || 'Manual booking — added by admin',
        detailerId,
      }, {
        override,
        initiatedBy: 'admin',
        status: 'CONFIRMED',
      });

      audit('booking', booking.id, 'manual_booking_created',
        null,
        { confirmationCode: booking.confirmationCode, override },
        getIp(req)
      ).catch(() => {});

      return res.status(201).json({
        success: true,
        message: 'Manual booking created successfully',
        booking: {
          id:               booking.id,
          confirmationCode: booking.confirmationCode,
          status:           booking.status,
          date:             booking.date,
          time:             booking.time,
          slotId:           booking.slotId,
          startAt:          booking.startAt,
          firstName:        booking.firstName,
          lastName:         booking.lastName,
          phoneNumber:      booking.phoneNumber,
        },
      });
    } catch (err) {
      if (err instanceof BookingConflictError) {
        // Return conflict details so the frontend can show an override prompt
        return res.status(409).json({
          success:      false,
          conflict:     true,
          message:      err.message,
          conflictCode: err.conflictCode,
          hint:         'Pass override:true to proceed (this will be logged)',
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Create manual booking error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Confirmation code conflict, please try again' });
    }
    res.status(500).json({ success: false, message: 'Error creating manual booking' });
  }
};

module.exports = { createManualBooking };
