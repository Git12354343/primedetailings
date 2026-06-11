/**
 * availabilityController.js
 *
 * Changes from original:
 *   - Availability is computed using INTERVAL OVERLAP on startAt/endAt,
 *     not string-equality on the label.
 *   - All date parsing uses America/Toronto via luxon — no more
 *     `new Date(date+'T12:00:00')` guessing.
 *   - slotId-based booking counts replace label-based counts.
 *   - getBlockedDates renamed to getBookedSlots to avoid confusion with
 *     admin-blocked dates (scheduleController.getBlockedDates).
 *   - serviceDuration / bufferTime from config are now actually used.
 *   - BUSINESS_CONFIG removed (was never exported safely); use loadConfig().
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const { DateTime }     = require('luxon');
const { getConfig }    = require('./scheduleController');
const {
  computeStartAt,
  computeEndAt,
  toDateStr,
  TZ,
}                      = require('../services/bookingAtomic');

const prisma = new PrismaClient();

// ── Default config (used when DB has nothing yet) ─────────────────────────────
const DEFAULT_CONFIG = {
  workingDays:        [1, 2, 3, 4, 5],
  operatingHours:     { start: 8, end: 18 },
  timeSlots: [
    { id: 'morning',   label: '8:00 AM',  startHour: 8,  endHour: 12 },
    { id: 'afternoon', label: '1:00 PM',  startHour: 13, endHour: 18 },
  ],
  maxBookingsPerSlot: 1,
  minAdvanceHours:    24,
  maxAdvanceDays:     60,
  serviceDuration:    4,    // hours
  bufferTime:         0.5,  // hours (30 min)
  maxJobsPerDay:      2,
};

// Safe async config loader — never throws
const loadConfig = async () => {
  try {
    const cfg = await getConfig();
    if (!cfg) return DEFAULT_CONFIG;
    return {
      ...DEFAULT_CONFIG,
      ...cfg,
      operatingHours:  cfg.operatingHours  ?? DEFAULT_CONFIG.operatingHours,
      timeSlots:       Array.isArray(cfg.timeSlots) && cfg.timeSlots.length
                         ? cfg.timeSlots : DEFAULT_CONFIG.timeSlots,
      workingDays:     Array.isArray(cfg.workingDays) ? cfg.workingDays : DEFAULT_CONFIG.workingDays,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

// Load admin-blocked dates from AppConfig table
const loadAdminBlockedDates = async () => {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: 'blocked_dates' } });
    if (row?.value && Array.isArray(row.value)) {
      return new Set(row.value.map(b => b.date));
    }
  } catch {}
  return new Set();
};

// ─────────────────────────────────────────────────────────────────────────────
// Core: isTimeSlotAvailable
// Now uses interval overlap, not label-count.
// ─────────────────────────────────────────────────────────────────────────────
const isTimeSlotAvailable = async (dateStr, slotId, opts = {}) => {
  try {
    const { excludeBookingId = null } = opts;
    const config  = await loadConfig();
    const blocked = await loadAdminBlockedDates();

    // Working-day + blocked check
    const torontoDay = DateTime.fromISO(dateStr, { zone: TZ });
    const today      = DateTime.now().setZone(TZ).startOf('day');

    if (torontoDay < today) {
      return { available: false, reason: 'Date is in the past' };
    }
    if (blocked.has(dateStr)) {
      return { available: false, reason: 'This date has been blocked by admin' };
    }

    const dayOfWeek = torontoDay.weekday % 7; // luxon 1=Mon…7=Sun; convert to 0=Sun…6=Sat
    if (!config.workingDays.includes(dayOfWeek)) {
      return { available: false, reason: 'Not a working day' };
    }

    // Advance-notice check
    const slotConfig = config.timeSlots.find(s => s.id === slotId);
    if (!slotConfig) {
      return { available: false, reason: `Unknown slot: ${slotId}` };
    }

    const startAt    = computeStartAt(dateStr, slotConfig.startHour);
    const now        = new Date();
    const hoursUntil = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < config.minAdvanceHours) {
      return { available: false, reason: `At least ${config.minAdvanceHours}h advance notice required` };
    }
    if (hoursUntil / 24 > config.maxAdvanceDays) {
      return { available: false, reason: `Cannot book more than ${config.maxAdvanceDays} days in advance` };
    }

    // Compute what the end time would be for this slot
    const durationMinutes = (config.serviceDuration  || 4)   * 60;
    const bufferMinutes   = (config.bufferTime        || 0.5) * 60;
    const endAt           = computeEndAt(startAt, durationMinutes, bufferMinutes);

    // Count overlapping active bookings for this interval
    const overlapWhere = {
      startAt: { not: null, lt: endAt   },
      endAt:   { not: null, gt: startAt },
      status:  { notIn: ['CANCELED', 'NO_SHOW'] },
    };
    if (excludeBookingId) {
      overlapWhere.id = { not: excludeBookingId };
    }

    const existingCount = await prisma.booking.count({ where: overlapWhere });

    // Also count same-day jobs for maxJobsPerDay
    if (config.maxJobsPerDay) {
      const dayStart = computeStartAt(dateStr, 0);
      const dayEnd   = computeStartAt(dateStr, 24);
      const dayCount = await prisma.booking.count({
        where: {
          startAt: { gte: dayStart, lt: dayEnd },
          status:  { notIn: ['CANCELED', 'NO_SHOW'] },
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        },
      });
      if (dayCount >= config.maxJobsPerDay) {
        return { available: false, reason: `Maximum ${config.maxJobsPerDay} jobs per day reached` };
      }
    }

    if (existingCount >= (config.maxBookingsPerSlot || 1)) {
      return {
        available: false,
        reason: 'This time slot is fully booked',
        existingCount,
      };
    }

    return {
      available:      true,
      timeSlot:       slotConfig,
      startAt,
      endAt,
      existingCount,
      slotsRemaining: (config.maxBookingsPerSlot || 1) - existingCount,
    };
  } catch (error) {
    console.error('isTimeSlotAvailable error:', error);
    return { available: false, reason: 'Error checking availability' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability
// ─────────────────────────────────────────────────────────────────────────────
const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'startDate is required' });
    }

    const [config, blockedDates] = await Promise.all([loadConfig(), loadAdminBlockedDates()]);

    const start = DateTime.fromISO(startDate, { zone: TZ }).startOf('day');
    const end   = endDate
      ? DateTime.fromISO(endDate, { zone: TZ }).startOf('day')
      : start.plus({ days: 30 });

    // Pull all active bookings in the range (using startAt for accuracy)
    const rangeStart = start.toJSDate();
    const rangeEnd   = end.plus({ days: 1 }).toJSDate();

    const bookings = await prisma.booking.findMany({
      where: {
        startAt: { gte: rangeStart, lt: rangeEnd },
        status:  { notIn: ['CANCELED', 'NO_SHOW'] },
      },
      select: { slotId: true, time: true, startAt: true, endAt: true, status: true },
    });

    // Build a per-day overlap checker
    const activeByDay = {};
    for (const b of bookings) {
      if (!b.startAt) continue;
      const day = toDateStr(b.startAt);
      if (!activeByDay[day]) activeByDay[day] = [];
      activeByDay[day].push(b);
    }

    const today    = DateTime.now().setZone(TZ).startOf('day');
    const availability = [];
    let current    = start;

    while (current <= end) {
      const dateStr   = current.toISODate();
      const dayOfWeek = current.weekday % 7; // 0=Sun…6=Sat
      const isPast    = current < today;
      const isBlocked = blockedDates.has(dateStr);
      const isWorking = config.workingDays.includes(dayOfWeek);

      let tooSoon = false;
      if (!isPast && isWorking) {
        const firstSlot  = config.timeSlots[0];
        const firstStart = firstSlot ? computeStartAt(dateStr, firstSlot.startHour) : null;
        if (firstStart) {
          const hoursUntil = (firstStart.getTime() - Date.now()) / (1000 * 60 * 60);
          tooSoon = hoursUntil < config.minAdvanceHours;
        }
      }

      const dayBookings = activeByDay[dateStr] || [];
      const durationMin = (config.serviceDuration || 4)   * 60;
      const bufferMin   = (config.bufferTime       || 0.5) * 60;

      const timeSlots = config.timeSlots.map(slot => {
        let reason = null;
        if (isPast)       reason = 'Past date';
        else if (isBlocked)  reason = 'Blocked by admin';
        else if (!isWorking) reason = 'Not a working day';
        else if (tooSoon)    reason = `Book at least ${config.minAdvanceHours}h in advance`;

        if (!reason) {
          const slotStart = computeStartAt(dateStr, slot.startHour);
          const slotEnd   = computeEndAt(slotStart, durationMin, bufferMin);

          // Count overlapping bookings for this slot window
          const overlapCount = dayBookings.filter(b => {
            if (!b.startAt || !b.endAt) {
              // Legacy booking without startAt — fall back to label match
              return b.time === slot.label || b.slotId === slot.id;
            }
            return new Date(b.startAt) < slotEnd && new Date(b.endAt) > slotStart;
          }).length;

          if (overlapCount >= (config.maxBookingsPerSlot || 1)) {
            reason = 'Fully booked';
          }
        }

        return {
          id:           slot.id,
          label:        slot.label,
          startHour:    slot.startHour,
          endHour:      slot.endHour,
          available:    !reason,
          bookingCount: dayBookings.filter(b => b.slotId === slot.id || b.time === slot.label).length,
          reason,
        };
      });

      availability.push({
        date:         dateStr,
        dayOfWeek,
        isWorkingDay: isWorking && !isBlocked && !isPast && !tooSoon && timeSlots.some(s => s.available),
        isBlocked,
        isPast,
        tooSoon,
        bookingCount: dayBookings.length,
        timeSlots,
      });

      current = current.plus({ days: 1 });
    }

    res.json({
      success: true,
      availability,
      businessConfig: {
        operatingHours:     config.operatingHours,
        timeSlots:          config.timeSlots,
        minAdvanceHours:    config.minAdvanceHours,
        maxAdvanceDays:     config.maxAdvanceDays,
        maxBookingsPerSlot: config.maxBookingsPerSlot,
        workingDays:        config.workingDays,
        serviceDuration:    config.serviceDuration || 4,
        bufferTime:         config.bufferTime      || 0.5,
        maxJobsPerDay:      config.maxJobsPerDay   || 2,
      },
    });
  } catch (error) {
    console.error('getAvailability error:', error);
    res.status(500).json({ success: false, message: 'Error fetching availability' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/check
// ─────────────────────────────────────────────────────────────────────────────
const checkTimeSlot = async (req, res) => {
  try {
    const { date, timeSlot, time } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });

    const config = await loadConfig();
    let slotId   = timeSlot;

    if (!slotId && time) {
      // Accept both id and label
      slotId = config.timeSlots.find(s => s.label === time || s.id === time)?.id;
    }

    if (!slotId) {
      const d      = DateTime.fromISO(date, { zone: TZ });
      const blocked = await loadAdminBlockedDates();
      const isWorking = config.workingDays.includes(d.weekday % 7) && !blocked.has(date);
      return res.json({ success: true, date, available: isWorking });
    }

    const result = await isTimeSlotAvailable(date, slotId);
    res.json({ success: true, date, timeSlot: slotId, ...result });
  } catch (error) {
    console.error('checkTimeSlot error:', error);
    res.status(500).json({ success: false, message: 'Error checking time slot' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/booked-slots  (renamed from getBlockedDates)
// Returns actual bookings in a range — NOT the same as admin-blocked dates.
// ─────────────────────────────────────────────────────────────────────────────
const getBookedSlots = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? DateTime.fromISO(startDate, { zone: TZ }).startOf('day').toJSDate()
      : new Date();
    const end = endDate
      ? DateTime.fromISO(endDate,   { zone: TZ }).endOf('day').toJSDate()
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { startAt: { gte: start, lte: end } },
          // Legacy: bookings without startAt fall back to date column
          { startAt: null, date: { gte: start, lte: end } },
        ],
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
      },
      select: {
        date:             true,
        time:             true,
        slotId:           true,
        startAt:          true,
        endAt:            true,
        status:           true,
        confirmationCode: true,
      },
    });

    res.json({
      success: true,
      bookedSlots: bookings.map(b => ({
        date:             b.startAt ? toDateStr(b.startAt) : b.date?.toISOString().split('T')[0],
        time:             b.time,
        slotId:           b.slotId,
        startAt:          b.startAt,
        endAt:            b.endAt,
        status:           b.status,
        confirmationCode: b.confirmationCode,
      })),
    });
  } catch (error) {
    console.error('getBookedSlots error:', error);
    res.status(500).json({ success: false, message: 'Error fetching booked slots' });
  }
};

// Legacy alias — keeps existing callers working during transition
const getBlockedDates = getBookedSlots;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/availability/validate
// ─────────────────────────────────────────────────────────────────────────────
const validateBookingRequest = async (req, res) => {
  try {
    const { date, time, slotId } = req.body;
    if (!date || (!time && !slotId)) {
      return res.status(400).json({ success: false, message: 'date and time/slotId are required' });
    }

    const config    = await loadConfig();
    const resolvedId = slotId
      || config.timeSlots.find(s => s.label === time || s.id === time)?.id;

    if (!resolvedId) {
      return res.status(400).json({ success: false, message: 'Invalid time slot' });
    }

    const result = await isTimeSlotAvailable(date, resolvedId);
    if (!result.available) {
      return res.status(409).json({ success: false, message: result.reason });
    }

    res.json({ success: true, validation: { available: true, date, slotId: resolvedId, timeSlot: result.timeSlot } });
  } catch (error) {
    console.error('validateBookingRequest error:', error);
    res.status(500).json({ success: false, message: 'Error validating booking' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/conflicts  (new — for admin pre-checks)
// Returns any bookings that would overlap a proposed [startAt, endAt] window.
// ─────────────────────────────────────────────────────────────────────────────
const getConflicts = async (req, res) => {
  try {
    const { date, slotId, excludeBookingId } = req.query;
    if (!date || !slotId) {
      return res.status(400).json({ success: false, message: 'date and slotId are required' });
    }

    const config     = await loadConfig();
    const slot       = config.timeSlots.find(s => s.id === slotId);
    if (!slot) return res.status(400).json({ success: false, message: 'Unknown slotId' });

    const durationMin = (config.serviceDuration || 4)   * 60;
    const bufferMin   = (config.bufferTime       || 0.5) * 60;
    const startAt     = computeStartAt(date, slot.startHour);
    const endAt       = computeEndAt(startAt, durationMin, bufferMin);

    const where = {
      startAt: { not: null, lt: endAt   },
      endAt:   { not: null, gt: startAt },
      status:  { notIn: ['CANCELED', 'NO_SHOW'] },
    };
    if (excludeBookingId) where.id = { not: parseInt(excludeBookingId) };

    const conflicts = await prisma.booking.findMany({
      where,
      select: {
        id: true, confirmationCode: true, firstName: true,
        lastName: true, time: true, slotId: true, startAt: true, status: true,
      },
    });

    res.json({ success: true, conflicts, hasConflict: conflicts.length > 0 });
  } catch (error) {
    console.error('getConflicts error:', error);
    res.status(500).json({ success: false, message: 'Error checking conflicts' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/config
// ─────────────────────────────────────────────────────────────────────────────
const getBusinessConfig = async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('getBusinessConfig error:', error);
    res.status(500).json({ success: false, message: 'Error fetching business config' });
  }
};

module.exports = {
  getAvailability,
  checkTimeSlot,
  getBookedSlots,
  getBlockedDates,  // legacy alias
  validateBookingRequest,
  getConflicts,
  getBusinessConfig,
  isTimeSlotAvailable,
  loadConfig,
};
