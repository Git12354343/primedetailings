/**
 * quotes.js  (modified convert endpoints only — rest is unchanged)
 *
 * Changes:
 *  - POST /api/quotes/admin/:id/convert  → createBookingAtomic, requires slotId
 *  - POST /api/quotes/:ref/accept        → validates preferredDate/preferredTime
 *    are actual slot labels/ids (not enforced — they're still just stored as
 *    preferences for the admin to act on; no booking created at accept time)
 *
 * PASTE THIS FILE over your existing quotes.js.
 * Only the convert route and one helper are changed; all other routes are identical.
 */

'use strict';

const express    = require('express');
const router     = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma     = new PrismaClient();
const requireAdmin = require('../middleware/requireAdmin');
const { audit }  = require('../services/auditService');
const emailService = require('../services/emailService');
const { sms }    = require('../services/smsService');
const {
  createBookingAtomic,
  BookingConflictError,
  resolveSlotId,
}                = require('../services/bookingAtomic');
const { loadConfig } = require('../controllers/availabilityController');

const sendCustomerQuoteReady = (quote) =>
  emailService.sendCustomerQuoteReady?.(quote).catch(() => {});

// ─── Admin: list quotes ───────────────────────────────────────────────────────
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const quotes = await prisma.quote.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, quotes });
  } catch (err) {
    console.error('Admin get quotes error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching quotes.' });
  }
});

// ─── Admin: quick count for sidebar badge ────────────────────────────────────
router.get('/admin/count', requireAdmin, async (req, res) => {
  try {
    const count = await prisma.quote.count({ where: { status: { in: ['NEW', 'REVIEWING'] } } });
    return res.json({ success: true, count });
  } catch {
    return res.json({ success: true, count: 0 });
  }
});

// ─── Admin: update status/price/notes ────────────────────────────────────────
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, quotedPrice, adminNotes } = req.body;
    const data = {};
    if (status)                                             data.status      = status;
    if (adminNotes !== undefined)                           data.adminNotes  = adminNotes;
    if (quotedPrice !== undefined && quotedPrice !== null && quotedPrice !== '') {
      data.quotedPrice = parseFloat(quotedPrice);
    }

    const quote = await prisma.quote.update({ where: { id }, data });

    if (status === 'QUOTED' && quote.quotedPrice) {
      sendCustomerQuoteReady(quote);
      sms.quoteReady(quote).catch(() => {});
    }
    if (status === 'DECLINED') sms.quoteDeclined(quote).catch(() => {});
    audit('quote', quote.id, `status_changed:${status}`, null, { status, quotedPrice }, null);

    return res.json({ success: true, quote });
  } catch (err) {
    console.error('Update quote error:', err);
    return res.status(500).json({ success: false, message: 'Error updating quote.' });
  }
});

// ─── Admin: convert accepted quote to booking ─────────────────────────────────
// CHANGED: requires slotId (or a valid slot label), runs createBookingAtomic,
// supports override:true for admin-forced conversions.
router.post('/admin/:id/convert', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, time, slotId: rawSlotId, override = false } = req.body;

    if (!date || (!time && !rawSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'date and either slotId or time are required to create a booking.',
      });
    }

    // Resolve to a stable slotId
    const slotId = rawSlotId || await resolveSlotId(time);
    if (!slotId) {
      const config = await loadConfig();
      const valid  = (config.timeSlots || []).map(s => `${s.id} (${s.label})`).join(', ');
      return res.status(400).json({
        success: false,
        message: `"${time}" doesn't match any configured slot. Valid slots: ${valid}`,
      });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote)                      return res.status(404).json({ success: false, message: 'Quote not found.' });
    if (quote.status === 'CONVERTED') return res.status(400).json({ success: false, message: 'Quote already converted.' });

    // Split customerName into firstName / lastName
    const nameParts = quote.customerName.trim().split(' ');
    const firstName = nameParts[0]           || 'Customer';
    const lastName  = nameParts.slice(1).join(' ') || '';

    try {
      const booking = await createBookingAtomic({
        date, slotId,
        time: time || slotId,  // display label; if only slotId given, slot label used inside atomic
        firstName, lastName,
        phoneNumber:      quote.phoneNumber,
        email:            quote.email || '',
        address:          quote.address,
        city:             quote.city,
        postalCode:       quote.postalCode,
        vehicleType:      quote.vehicleType,
        vehicleCondition: quote.vehicleCondition,
        make:             quote.make  || null,
        model:            quote.model || null,
        year:             quote.year  || null,
        services:         quote.services,
        packageId:        quote.packageId || null,
        totalPrice:       quote.quotedPrice || null,
        specialInstructions: quote.notes   || null,
        propertyType:     '',
        hasWaterPower:    true,
      }, {
        override,
        initiatedBy: 'admin',
        status: 'CONFIRMED',
      });

      // Link booking to quote and mark converted
      await prisma.quote.update({
        where: { id },
        data: { status: 'CONVERTED', bookingId: booking.id },
      });

      audit('quote', id, 'converted', { status: quote.status }, { bookingId: booking.id, override }, null);

      return res.json({
        success:          true,
        bookingId:        booking.id,
        confirmationCode: booking.confirmationCode,
        slotId:           booking.slotId,
        startAt:          booking.startAt,
      });
    } catch (err) {
      if (err instanceof BookingConflictError) {
        return res.status(409).json({
          success:      false,
          conflict:     true,
          message:      err.message,
          conflictCode: err.conflictCode,
          hint:         'Pass override:true to proceed (will be audited)',
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Convert quote error:', err);
    return res.status(500).json({ success: false, message: 'Error converting quote to booking.' });
  }
});

// ─── Public: customer accepts quote ──────────────────────────────────────────
// No booking created here — stores preferences only. Admin converts separately.
router.post('/:referenceId/accept', async (req, res) => {
  try {
    const ref = req.params.referenceId.toUpperCase();
    if (!ref.startsWith('Q-')) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const { preferredDate, preferredTime } = req.body;

    const quote = await prisma.quote.findUnique({ where: { referenceId: ref } });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
    if (!['QUOTED'].includes(quote.status)) {
      return res.status(400).json({ success: false, message: `Quote cannot be accepted in status: ${quote.status}` });
    }

    const updated = await prisma.quote.update({
      where: { referenceId: ref },
      data: {
        status:        'ACCEPTED',
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
      },
    });

    sms.ownerQuoteAccepted(updated).catch(() => {});
    audit('quote', quote.id, 'customer_accepted', { status: 'QUOTED' }, { status: 'ACCEPTED', preferredDate, preferredTime }, null);

    return res.json({
      success: true,
      message: 'Quote accepted. We will contact you shortly to confirm your appointment.',
    });
  } catch (err) {
    console.error('Accept quote error:', err);
    return res.status(500).json({ success: false, message: 'Error accepting quote.' });
  }
});

// ─── Public: customer declines quote ─────────────────────────────────────────
router.post('/:referenceId/decline', async (req, res) => {
  try {
    const ref = req.params.referenceId.toUpperCase();
    if (!ref.startsWith('Q-')) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const quote = await prisma.quote.findUnique({ where: { referenceId: ref } });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
    if (!['QUOTED', 'ACCEPTED'].includes(quote.status)) {
      return res.status(400).json({ success: false, message: 'Nothing to decline at this stage.' });
    }

    await prisma.quote.update({ where: { referenceId: ref }, data: { status: 'DECLINED' } });
    sms.quoteDeclined(quote).catch(() => {});
    audit('quote', quote.id, 'customer_declined', { status: quote.status }, { status: 'DECLINED' }, null);

    return res.json({ success: true, message: 'Quote declined.' });
  } catch (err) {
    console.error('Decline quote error:', err);
    return res.status(500).json({ success: false, message: 'Error declining quote.' });
  }
});

// ─── Public: get quote by referenceId ────────────────────────────────────────
router.get('/:referenceId', async (req, res) => {
  try {
    const ref = req.params.referenceId.toUpperCase();
    if (!ref.startsWith('Q-')) return res.status(404).json({ success: false, message: 'Quote not found.' });

    const quote = await prisma.quote.findUnique({ where: { referenceId: ref } });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    return res.json({ success: true, quote });
  } catch (err) {
    console.error('Get quote error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching quote.' });
  }
});

module.exports = router;
