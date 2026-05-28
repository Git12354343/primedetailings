const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getConfig } = require('./scheduleController');

// ── Default config fallback ───────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  workingDays:        [1, 2, 3, 4, 5],
  operatingHours:     { start: 8, end: 18 },
  timeSlots: [
    { id: 'morning',   label: '8:00 AM',  startHour: 8,  endHour: 14 },
    { id: 'afternoon', label: '12:00 PM', startHour: 12, endHour: 18 },
  ],
  maxBookingsPerSlot: 1,
  minAdvanceHours:    24,
  maxAdvanceDays:     60,
  serviceDuration:    4,
  bufferTime:         2,
};

// Safe async config loader — never throws
const loadConfig = async () => {
  try {
    const cfg = await getConfig();
    if (!cfg) return DEFAULT_CONFIG;
    return {
      ...DEFAULT_CONFIG,
      ...cfg,
      operatingHours: cfg.operatingHours ?? DEFAULT_CONFIG.operatingHours,
      timeSlots:      (Array.isArray(cfg.timeSlots) && cfg.timeSlots.length)
                        ? cfg.timeSlots : DEFAULT_CONFIG.timeSlots,
      workingDays:    Array.isArray(cfg.workingDays) ? cfg.workingDays : DEFAULT_CONFIG.workingDays,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

// Load admin-blocked dates from app_config table
const loadAdminBlockedDates = async () => {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: 'blocked_dates' } });
    if (row?.value && Array.isArray(row.value)) {
      return new Set(row.value.map(b => b.date));
    }
  } catch {}
  return new Set();
};

// ── isTimeSlotAvailable ───────────────────────────────────────────────────────
const isTimeSlotAvailable = async (date, timeSlotId) => {
  try {
    const config  = await loadConfig();
    const blocked = await loadAdminBlockedDates();

    const requestedDate = new Date(date + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return { available: false, reason: 'Date is in the past' };
    }
    if (blocked.has(date)) {
      return { available: false, reason: 'This date has been blocked by admin' };
    }

    const hoursUntil = (requestedDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < config.minAdvanceHours) {
      return { available: false, reason: `Minimum ${config.minAdvanceHours}h advance notice required` };
    }
    if (hoursUntil / 24 > config.maxAdvanceDays) {
      return { available: false, reason: `Cannot book more than ${config.maxAdvanceDays} days in advance` };
    }

    const dayOfWeek = requestedDate.getDay();
    if (!config.workingDays.includes(dayOfWeek)) {
      return { available: false, reason: 'Not a working day' };
    }

    const slotConfig = config.timeSlots.find(s => s.id === timeSlotId);
    if (!slotConfig) {
      return { available: false, reason: 'Invalid time slot' };
    }

    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay   = new Date(date + 'T23:59:59');

    const existingCount = await prisma.booking.count({
      where: {
        date:   { gte: startOfDay, lte: endOfDay },
        time:   slotConfig.label,
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
      },
    });

    if (existingCount >= config.maxBookingsPerSlot) {
      return { available: false, reason: 'This time slot is fully booked', existingCount };
    }

    return {
      available:      true,
      timeSlot:       slotConfig,
      startTime:      `${String(slotConfig.startHour).padStart(2, '0')}:00`,
      endTime:        `${String(slotConfig.endHour).padStart(2, '0')}:00`,
      existingCount,
      slotsRemaining: config.maxBookingsPerSlot - existingCount,
    };
  } catch (error) {
    devError.error('isTimeSlotAvailable error:', error);
    return { available: false, reason: 'Error checking availability' };
  }
};

// ── GET /api/availability ─────────────────────────────────────────────────────
const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'startDate is required' });
    }

    const [config, blockedDates] = await Promise.all([loadConfig(), loadAdminBlockedDates()]);

    const start = new Date(startDate + 'T12:00:00');
    const end   = endDate
      ? new Date(endDate   + 'T12:00:00')
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch all bookings in range — include time so we can count per slot
    const bookings = await prisma.booking.findMany({
      where: {
        date:   { gte: new Date(startDate + 'T00:00:00'), lte: new Date((endDate || startDate) + 'T23:59:59') },
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
      },
      select: { date: true, time: true, status: true },
    });

    // Count bookings per date+slot key e.g. '2025-06-01::8:00 AM'
    const countBySlot = {};
    bookings.forEach(b => {
      const d   = b.date.toISOString().split('T')[0];
      const key = `${d}::${b.time}`;
      countBySlot[key] = (countBySlot[key] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availability = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr    = current.toISOString().split('T')[0];
      const dayOfWeek  = current.getDay();
      const isPast     = new Date(dateStr + 'T00:00:00') < today;
      const isBlocked  = blockedDates.has(dateStr);
      const isWorking  = config.workingDays.includes(dayOfWeek);
      const isAvailable = isWorking && !isBlocked && !isPast;

      // Check min advance hours for today/tomorrow
      let tooSoon = false;
      if (!isPast && isWorking) {
        const hoursUntil = (new Date(dateStr + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60);
        tooSoon = hoursUntil < config.minAdvanceHours;
      }

      // Count per-slot bookings for this date and check availability individually
      const buildSlot = (slot, reason = null) => {
        const slotCount = countBySlot[`${dateStr}::${slot.label}`] || 0;
        return {
          id:        slot.id,
          label:     slot.label,
          startHour: slot.startHour,
          endHour:   slot.endHour,
          available: !reason && slotCount < config.maxBookingsPerSlot,
          bookingCount: slotCount,
          reason,
        };
      };

      let timeSlots;
      if (isPast) {
        timeSlots = config.timeSlots.map(s => buildSlot(s, 'Past date'));
      } else if (isBlocked) {
        timeSlots = config.timeSlots.map(s => buildSlot(s, 'Blocked by admin'));
      } else if (!isWorking) {
        timeSlots = config.timeSlots.map(s => buildSlot(s, 'Not a working day'));
      } else if (tooSoon) {
        timeSlots = config.timeSlots.map(s => buildSlot(s, `Book at least ${config.minAdvanceHours}h in advance`));
      } else {
        timeSlots = config.timeSlots.map(s => buildSlot(s));
      }

      // Day is fully open if at least one slot is available
      const totalBookingsOnDay = Object.entries(countBySlot)
        .filter(([k]) => k.startsWith(dateStr + '::'))
        .reduce((sum, [, v]) => sum + v, 0);

      availability.push({
        date:        dateStr,
        dayOfWeek,
        isWorkingDay: isAvailable && !tooSoon && timeSlots.some(s => s.available),
        isBlocked,
        isPast,
        tooSoon,
        bookingCount: totalBookingsOnDay,
        timeSlots,
      });

      current.setDate(current.getDate() + 1);
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
        bufferTime:         config.bufferTime       || 2,
      },
    });
  } catch (error) {
    devError.error('getAvailability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error:   process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ── GET /api/availability/check ───────────────────────────────────────────────
const checkTimeSlot = async (req, res) => {
  try {
    const { date, timeSlot, time } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }

    const config = await loadConfig();
    let slotId = timeSlot;

    if (!slotId && time) {
      slotId = config.timeSlots.find(s => s.label === time)?.id;
    }

    if (!slotId) {
      // No slot specified — just check if the date is open
      const d = new Date(date + 'T12:00:00');
      const blocked = await loadAdminBlockedDates();
      const isWorking = config.workingDays.includes(d.getDay()) && !blocked.has(date);
      return res.json({ success: true, date, available: isWorking });
    }

    const result = await isTimeSlotAvailable(date, slotId);
    res.json({ success: true, date, timeSlot: slotId, ...result });
  } catch (error) {
    devError.error('checkTimeSlot error:', error);
    res.status(500).json({ success: false, message: 'Error checking time slot' });
  }
};

// ── GET /api/availability/blocked ─────────────────────────────────────────────
const getBlockedDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    const end   = endDate   ? new Date(endDate + 'T23:59:59')   : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end }, status: { notIn: ['CANCELED', 'NO_SHOW'] } },
      select: { date: true, time: true, status: true, confirmationCode: true },
    });

    res.json({
      success: true,
      blockedDates: bookings.map(b => ({
        date:             b.date.toISOString().split('T')[0],
        time:             b.time,
        status:           b.status,
        confirmationCode: b.confirmationCode,
      })),
    });
  } catch (error) {
    devError.error('getBlockedDates error:', error);
    res.status(500).json({ success: false, message: 'Error fetching blocked dates' });
  }
};

// ── POST /api/availability/validate ──────────────────────────────────────────
const validateBookingRequest = async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required' });
    }

    const config = await loadConfig();
    const slotId = config.timeSlots.find(s => s.label === time)?.id;

    if (!slotId) {
      return res.status(400).json({ success: false, message: 'Invalid time slot' });
    }

    const result = await isTimeSlotAvailable(date, slotId);
    if (!result.available) {
      return res.status(409).json({ success: false, message: result.reason });
    }

    res.json({ success: true, validation: { available: true, date, time, timeSlot: result.timeSlot } });
  } catch (error) {
    devError.error('validateBookingRequest error:', error);
    res.status(500).json({ success: false, message: 'Error validating booking' });
  }
};

// ── GET /api/availability/config ──────────────────────────────────────────────
const getBusinessConfig = async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ success: true, config });
  } catch (error) {
    devError.error('getBusinessConfig error:', error);
    res.status(500).json({ success: false, message: 'Error fetching business config' });
  }
};

module.exports = {
  getAvailability,
  checkTimeSlot,
  getBlockedDates,
  validateBookingRequest,
  getBusinessConfig,
  isTimeSlotAvailable,
};