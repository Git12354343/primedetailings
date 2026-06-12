// backend/routes/customers.js
// Admin CRM endpoints: customer list with LTV, full profiles, edits, and the
// one-time historical backfill.

const express = require('express');
const prisma  = require('../prisma/lib/prisma_lib');
const { backfillCustomers } = require('../services/customerService');

const router = express.Router();

// Same admin gate used across the other admin route files.
const requireAdminSecret = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

router.use(requireAdminSecret);

const REVENUE_STATUSES = ['COMPLETED'];

// ── GET /api/customers — list with aggregates ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName:  { contains: search, mode: 'insensitive' } },
            { email:     { contains: search, mode: 'insensitive' } },
            { phone:     { contains: search.replace(/\D/g, '') || search } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      include: {
        bookings: { select: { totalPrice: true, status: true, startAt: true, date: true } },
        vehicles: { select: { id: true, type: true, make: true, model: true, year: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });

    const rows = customers.map(c => {
      const completed = c.bookings.filter(b => REVENUE_STATUSES.includes(b.status));
      const lifetimeValue = completed.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
      const lastBooking = c.bookings.reduce((latest, b) => {
        const d = b.startAt || b.date;
        return !latest || (d && d > latest) ? d : latest;
      }, null);
      return {
        id: c.id, phone: c.phone, email: c.email,
        firstName: c.firstName, lastName: c.lastName,
        isVip: c.isVip, marketingConsent: c.marketingConsent,
        notes: c.notes, createdAt: c.createdAt,
        vehicles: c.vehicles,
        totalBookings: c.bookings.length,
        completedBookings: completed.length,
        lifetimeValue,
        lastBooking,
      };
    });

    // VIPs and biggest spenders first
    rows.sort((a, b) => (b.isVip - a.isVip) || (b.lifetimeValue - a.lifetimeValue));

    res.json({ success: true, customers: rows, total: rows.length });
  } catch (err) {
    console.error('[customers] list error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load customers.' });
  }
});

// ── GET /api/customers/:id — full profile ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, confirmationCode: true, date: true, time: true, status: true,
            totalPrice: true, vehicleType: true, make: true, model: true,
            services: true, address: true, city: true, createdAt: true,
            package: { select: { name: true } },
          },
        },
      },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const completed = customer.bookings.filter(b => REVENUE_STATUSES.includes(b.status));
    res.json({
      success: true,
      customer: {
        ...customer,
        lifetimeValue: completed.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0),
        completedBookings: completed.length,
      },
    });
  } catch (err) {
    console.error('[customers] profile error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load customer.' });
  }
});

// ── PUT /api/customers/:id — edit notes / VIP / consent / identity ──────────
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isVip, marketingConsent, notes, email, firstName, lastName } = req.body;

    const data = {};
    if (typeof isVip === 'boolean')            data.isVip = isVip;
    if (typeof marketingConsent === 'boolean') data.marketingConsent = marketingConsent;
    if (notes !== undefined)                   data.notes = notes ? String(notes).slice(0, 2000) : null;
    if (email !== undefined)                   data.email = email ? String(email).toLowerCase().trim() : null;
    if (firstName !== undefined)               data.firstName = String(firstName).trim();
    if (lastName !== undefined)                data.lastName = String(lastName).trim();

    const customer = await prisma.customer.update({ where: { id }, data });
    res.json({ success: true, customer });
  } catch (err) {
    console.error('[customers] update error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update customer.' });
  }
});

// ── POST /api/customers/backfill — build CRM from historical bookings ───────
router.post('/backfill', async (req, res) => {
  try {
    const result = await backfillCustomers();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[customers] backfill error:', err.message);
    res.status(500).json({ success: false, message: 'Backfill failed: ' + err.message });
  }
});

// ── GET /api/customers/stats/recovery — abandoned-recovery reporting ────────
router.get('/stats/recovery', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const sent = await prisma.smsLog.findMany({
      where: { messageType: 'ABANDONED_RECOVERY', createdAt: { gte: since } },
      select: { toNumber: true, createdAt: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    // A recovery "converted" if a booking exists for that phone after the nudge.
    let converted = 0;
    for (const s of sent) {
      const digits = s.toNumber.replace(/\D/g, '').slice(-10);
      if (!digits) continue;
      const b = await prisma.booking.findFirst({
        where: { phoneNumber: { contains: digits }, createdAt: { gte: s.createdAt } },
        select: { id: true },
      });
      if (b) converted++;
    }

    res.json({ success: true, last30Days: { sent: sent.length, converted } });
  } catch (err) {
    console.error('[customers] recovery stats error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load recovery stats.' });
  }
});

module.exports = router;
