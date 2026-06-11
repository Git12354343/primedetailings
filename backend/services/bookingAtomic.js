/**
 * bookingAtomic.js
 *
 * Single canonical path for all booking creation.
 * Every write — customer SMS-verify, manual admin, quote convert — calls
 * createBookingAtomic(). Nobody calls prisma.booking.create() directly.
 *
 * Guarantees:
 *   - No double-booking: Serializable transaction + interval overlap check
 *   - Correct startAt/endAt in UTC computed from Toronto business time
 *   - Stable slotId stored on every booking (never the mutable label)
 *   - Google Calendar + audit side-effects on all three paths
 *
 * Usage:
 *   const { createBookingAtomic, BookingConflictError } = require('./bookingAtomic');
 *
 *   try {
 *     const booking = await createBookingAtomic(data, { override: false, initiatedBy: 'customer' });
 *   } catch (err) {
 *     if (err instanceof BookingConflictError) {
 *       return res.status(409).json({ success: false, message: err.message, conflictCode: err.conflictCode });
 *     }
 *     throw err;
 *   }
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const { DateTime }     = require('luxon');
const { getConfig }    = require('../controllers/scheduleController');

const prisma = new PrismaClient();

const TZ               = 'America/Toronto';
const DEFAULT_DURATION = 240; // 240 min (4 h) when service has no estimatedDuration
const DEFAULT_BUFFER   = 30;  // 30 min travel/buffer between jobs

// ── Load calendar side-effect safely ─────────────────────────────────────────
let _addToCalendar = null;
try { _addToCalendar = require('./googleCalendar').addBookingToCalendar; } catch {}

// ── Audit side-effect safely ──────────────────────────────────────────────────
let _audit = null;
try { _audit = require('./auditService').audit; } catch {}

// ─────────────────────────────────────────────────────────────────────────────
// Custom error so callers can distinguish conflict vs system error
// ─────────────────────────────────────────────────────────────────────────────
class BookingConflictError extends Error {
  constructor(message, conflictCode = null) {
    super(message);
    this.name         = 'BookingConflictError';
    this.conflictCode = conflictCode; // confirmation code of the conflicting booking
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timezone helpers (all Toronto-aware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD date string as a business-calendar day in Toronto.
 * Returns a Luxon DateTime at midnight Toronto time.
 */
const toTorontoDay = (dateStr) =>
  DateTime.fromISO(dateStr, { zone: TZ }).startOf('day');

/**
 * Compute UTC-stored startAt from a Toronto business date + slot start hour.
 */
const computeStartAt = (dateStr, startHour) =>
  toTorontoDay(dateStr).set({ hour: startHour, minute: 0, second: 0, millisecond: 0 }).toJSDate();

/**
 * Compute UTC-stored endAt from startAt + job duration (minutes) + buffer (minutes).
 */
const computeEndAt = (startAt, durationMinutes, bufferMinutes) => {
  const total = (durationMinutes || DEFAULT_DURATION) + (bufferMinutes || DEFAULT_BUFFER);
  return new Date(startAt.getTime() + total * 60 * 1000);
};

/**
 * Extract the calendar-day string "YYYY-MM-DD" from a UTC Date using Toronto time.
 */
const toDateStr = (utcDate) =>
  DateTime.fromJSDate(utcDate, { zone: TZ }).toISODate();

// ─────────────────────────────────────────────────────────────────────────────
// Unique confirmation code (collision-safe inside a transaction)
// ─────────────────────────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed ambiguous chars

const generateConfirmationCode = () =>
  Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

const reserveConfirmationCode = async (tx) => {
  for (let i = 0; i < 20; i++) {
    const code = generateConfirmationCode();
    const exists = await tx.booking.findUnique({ where: { confirmationCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique confirmation code after 20 attempts');
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createBookingAtomic
 *
 * @param {object} data  All booking fields. Must include:
 *   - date          {string}  YYYY-MM-DD (business calendar day)
 *   - slotId        {string}  stable slot id (e.g. 'morning')
 *   - time          {string}  display label (e.g. '8:00 AM') — stored for display only
 *   - firstName, lastName, phoneNumber, email
 *   - address, city, postalCode
 *   - vehicleType, make, model, year
 *   - services      {string}  JSON array string
 *   - extras        {string}  JSON array string (optional)
 *   - estimatedDuration {number} minutes (optional — falls back to DEFAULT_DURATION)
 *   - totalPrice, specialInstructions, notes, detailerId, packageId, etc.
 *
 * @param {object} options
 *   - override     {boolean} if true, proceed even if a conflict exists (admin use)
 *   - initiatedBy  {string}  'customer' | 'admin' (for audit log)
 *   - status       {string}  default 'PENDING' for customer, 'CONFIRMED' for admin
 *
 * @returns {object} The created Prisma Booking record
 * @throws  {BookingConflictError} if the slot is taken (and override is false)
 * @throws  {Error} for any other failure
 */
const createBookingAtomic = async (data, options = {}) => {
  const {
    override     = false,
    initiatedBy  = 'customer',
    status       = initiatedBy === 'admin' ? 'CONFIRMED' : 'PENDING',
  } = options;

  // ── 1. Load current schedule config ──────────────────────────────────────
  const config = await getConfig();

  // ── 2. Resolve the slot ───────────────────────────────────────────────────
  const slot = config.timeSlots?.find(s => s.id === data.slotId);
  if (!slot) {
    throw new BookingConflictError(
      `Invalid time slot: "${data.slotId}". Available slots: ${(config.timeSlots || []).map(s => s.id).join(', ')}`
    );
  }

  // ── 3. Compute startAt / endAt in UTC (Toronto-aware) ────────────────────
  const durationMinutes = data.estimatedDuration || config.serviceDuration * 60 || DEFAULT_DURATION;
  const bufferMinutes   = config.bufferTime   != null ? config.bufferTime   * 60 : DEFAULT_BUFFER;

  const startAt = computeStartAt(data.date, slot.startHour);
  const endAt   = computeEndAt(startAt, durationMinutes, bufferMinutes);

  // Sanity: startAt must be in the future
  const now           = new Date();
  const hoursUntil    = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const minAdvance    = config.minAdvanceHours ?? 24;
  const maxAdvanceDays = config.maxAdvanceDays  ?? 60;

  if (hoursUntil < 0 && !override) {
    throw new BookingConflictError('Cannot create a booking in the past');
  }
  if (hoursUntil < minAdvance && !override) {
    throw new BookingConflictError(`Minimum ${minAdvance}h advance notice required`);
  }
  if (hoursUntil / 24 > maxAdvanceDays && !override) {
    throw new BookingConflictError(`Cannot book more than ${maxAdvanceDays} days in advance`);
  }

  // ── 4. Atomic transaction: overlap check → insert ─────────────────────────
  const booking = await prisma.$transaction(async (tx) => {

    // Find any active booking whose [startAt, endAt] overlaps [newStart, newEnd].
    // Overlap condition: existingStart < newEnd  AND  existingEnd > newStart
    const conflicts = await tx.booking.findMany({
      where: {
        startAt: { lt: endAt   },
        endAt:   { gt: startAt },
        status:  { notIn: ['CANCELED', 'NO_SHOW'] },
      },
      select: { id: true, confirmationCode: true, firstName: true, time: true, startAt: true },
    });

    if (conflicts.length > 0 && !override) {
      const c = conflicts[0];
      throw new BookingConflictError(
        `This time slot overlaps an existing booking (#${c.confirmationCode} at ${c.time})`,
        c.confirmationCode
      );
    }

    const confirmationCode = await reserveConfirmationCode(tx);

    return await tx.booking.create({
      data: {
        // ── Customer / vehicle fields ──────────────────────────────────────
        firstName:           (data.firstName  || '').trim(),
        lastName:            (data.lastName   || '').trim(),
        email:               (data.email      || '').toLowerCase().trim(),
        phoneNumber:         (data.phoneNumber || '').trim(),
        address:             (data.address    || '').trim(),
        city:                (data.city       || '').trim(),
        postalCode:          (data.postalCode || '').trim(),
        vehicleType:         data.vehicleType || '',
        vehicleCondition:    data.vehicleCondition || '',
        make:                data.make  || null,
        model:               data.model || null,
        year:                data.year  ? parseInt(data.year) : null,
        propertyType:        data.propertyType   || '',
        hasWaterPower:       data.hasWaterPower  !== false,
        // ── Services ──────────────────────────────────────────────────────
        services:            typeof data.services === 'string' ? data.services : JSON.stringify(data.services || []),
        extras:              typeof data.extras   === 'string' ? data.extras   : JSON.stringify(data.extras   || []),
        // ── Scheduling ────────────────────────────────────────────────────
        date:                new Date(data.date + 'T12:00:00'),  // kept for display/legacy compat
        time:                data.time   || slot.label,           // display label
        slotId:              slot.id,                             // stable scheduling key
        startAt,
        endAt,
        estimatedDuration:   Math.round(durationMinutes),
        // ── Pricing / meta ────────────────────────────────────────────────
        totalPrice:          data.totalPrice    ? parseFloat(data.totalPrice) : null,
        packageId:           data.packageId     ? parseInt(data.packageId)    : null,
        specialInstructions: data.specialInstructions || null,
        notes:               data.notes         || null,
        detailerId:          data.detailerId    ? parseInt(data.detailerId)   : null,
        // ── Status / codes ────────────────────────────────────────────────
        status,
        confirmationCode,
        emailSent:           false,
        reminderSent:        false,
        prepEmailSent:       false,
        reviewRequestSent:   false,
      },
    });
  }, {
    isolationLevel: 'Serializable',
    timeout: 10_000,
  });

  // ── 5. Non-blocking side-effects (fire & forget) ─────────────────────────
  if (_addToCalendar) {
    _addToCalendar(booking).catch(err =>
      console.error('[bookingAtomic] Google Calendar error:', err.message)
    );
  }

  if (_audit) {
    _audit(
      'booking',
      booking.id,
      `created:${initiatedBy}`,
      null,
      { confirmationCode: booking.confirmationCode, startAt, slotId: slot.id },
      null
    ).catch(() => {});
  }

  console.log(
    `[bookingAtomic] ✅ Created booking ${booking.confirmationCode} ` +
    `(${data.date} slot:${slot.id}, startAt:${startAt.toISOString()}) ` +
    `initiatedBy:${initiatedBy}` +
    (override ? ' [OVERRIDE]' : '')
  );

  return booking;
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: resolve a slot from either slotId or label (for backwards compat)
// ─────────────────────────────────────────────────────────────────────────────
const resolveSlotId = async (slotIdOrLabel) => {
  const config = await getConfig();
  const slots  = config.timeSlots || [];
  // Try by id first, then by label
  const slot =
    slots.find(s => s.id    === slotIdOrLabel) ||
    slots.find(s => s.label === slotIdOrLabel);
  return slot ? slot.id : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: build a valid startAt from an existing booking (for cutoff checks)
// ─────────────────────────────────────────────────────────────────────────────
const getBookingStartAt = async (booking) => {
  // Fast path: startAt already stored
  if (booking.startAt) return new Date(booking.startAt);

  // Legacy path: derive from date + slot
  const config = await getConfig();
  const slot   = config.timeSlots?.find(s => s.id === booking.slotId)
               || config.timeSlots?.find(s => s.label === booking.time);
  if (!slot) return null;

  const dateStr = booking.date instanceof Date
    ? toDateStr(booking.date)
    : String(booking.date).split('T')[0];

  return computeStartAt(dateStr, slot.startHour);
};

module.exports = {
  createBookingAtomic,
  BookingConflictError,
  resolveSlotId,
  getBookingStartAt,
  computeStartAt,
  computeEndAt,
  toTorontoDay,
  toDateStr,
  TZ,
};
