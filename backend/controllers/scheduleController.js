const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SCHEDULE_CONFIG = {
  workingDays: [1, 2, 3, 4, 5],
  operatingHours: { start: 8, end: 18 },
  timeSlots: [
    { id: 'morning',   label: '8:00 AM',  startHour: 8,  endHour: 14 },
    { id: 'afternoon', label: '12:00 PM', startHour: 12, endHour: 18 }
  ],
  maxBookingsPerSlot: 1,
  minAdvanceHours: 24,
  maxAdvanceDays: 60
};

const DEFAULT_BLOCKED_DATES = [];

// ─── helpers ────────────────────────────────────────────────────────────────

const getOrCreate = async (key, defaultValue) => {
  let row = await prisma.appConfig.findUnique({ where: { key } });
  if (!row) {
    row = await prisma.appConfig.create({ data: { key, value: defaultValue } });
  }
  return row.value;
};

const upsert = async (key, value) => {
  return prisma.appConfig.upsert({
    where:  { key },
    update: { value },
    create: { key, value }
  });
};

// ─── GET /api/schedule/config ────────────────────────────────────────────────
const getScheduleConfig = async (req, res) => {
  try {
    const config = await getOrCreate('schedule_config', DEFAULT_SCHEDULE_CONFIG);
    res.json({ success: true, config });
  } catch (error) {
    console.error('getScheduleConfig error:', error);
    res.status(500).json({ success: false, message: 'Error fetching schedule config' });
  }
};

// ─── PUT /api/schedule/config ────────────────────────────────────────────────
const updateScheduleConfig = async (req, res) => {
  try {
    const {
      workingDays,
      operatingHours,
      timeSlots,
      maxBookingsPerSlot,
      minAdvanceHours,
      maxAdvanceDays
    } = req.body;

    // Load existing so we only overwrite provided fields
    const existing = await getOrCreate('schedule_config', DEFAULT_SCHEDULE_CONFIG);

    const updated = {
      workingDays:        workingDays        ?? existing.workingDays,
      operatingHours:     operatingHours     ?? existing.operatingHours,
      timeSlots:          timeSlots          ?? existing.timeSlots,
      maxBookingsPerSlot: maxBookingsPerSlot !== undefined ? parseInt(maxBookingsPerSlot) : existing.maxBookingsPerSlot,
      minAdvanceHours:    minAdvanceHours    !== undefined ? parseInt(minAdvanceHours)    : existing.minAdvanceHours,
      maxAdvanceDays:     maxAdvanceDays     !== undefined ? parseInt(maxAdvanceDays)     : existing.maxAdvanceDays
    };

    await upsert('schedule_config', updated);

    res.json({ success: true, message: 'Schedule config updated', config: updated });
  } catch (error) {
    console.error('updateScheduleConfig error:', error);
    res.status(500).json({ success: false, message: 'Error updating schedule config' });
  }
};

// ─── GET /api/schedule/blocked-dates ────────────────────────────────────────
const getBlockedDates = async (req, res) => {
  try {
    const blockedDates = await getOrCreate('blocked_dates', DEFAULT_BLOCKED_DATES);
    res.json({ success: true, blockedDates });
  } catch (error) {
    console.error('getBlockedDates error:', error);
    res.status(500).json({ success: false, message: 'Error fetching blocked dates' });
  }
};

// ─── POST /api/schedule/blocked-dates ───────────────────────────────────────
const blockDate = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const existing = await getOrCreate('blocked_dates', DEFAULT_BLOCKED_DATES);

    // Avoid duplicates
    if (!existing.find(b => b.date === date)) {
      existing.push({ date, reason: reason || 'Blocked by admin' });
    }

    await upsert('blocked_dates', existing);
    res.json({ success: true, message: `${date} blocked`, blockedDates: existing });
  } catch (error) {
    console.error('blockDate error:', error);
    res.status(500).json({ success: false, message: 'Error blocking date' });
  }
};

// ─── DELETE /api/schedule/blocked-dates/:date ────────────────────────────────
const unblockDate = async (req, res) => {
  try {
    const { date } = req.params;
    const existing = await getOrCreate('blocked_dates', DEFAULT_BLOCKED_DATES);
    const updated = existing.filter(b => b.date !== date);
    await upsert('blocked_dates', updated);
    res.json({ success: true, message: `${date} unblocked`, blockedDates: updated });
  } catch (error) {
    console.error('unblockDate error:', error);
    res.status(500).json({ success: false, message: 'Error unblocking date' });
  }
};

// ─── Used by availabilityController ─────────────────────────────────────────
// Returns a promise — callers must await it
const getConfig = async () => {
  return getOrCreate('schedule_config', DEFAULT_SCHEDULE_CONFIG);
};

module.exports = {
  getScheduleConfig,
  updateScheduleConfig,
  blockDate,
  unblockDate,
  getBlockedDates,
  getConfig
};