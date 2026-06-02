// backend/routes/quotes.js
const express   = require('express');
const router    = express.Router();
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Auth ──────────────────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.headers.authorization?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// ── Email helpers ─────────────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
});

const sendOwnerQuoteNotification = async (quote) => {
  try {
    const t = createTransporter();
    const serviceList = (() => { try { return JSON.parse(quote.services).join(', '); } catch { return quote.services || '—'; } })();
    await t.sendMail({
      from: `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to:   process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      replyTo: quote.email || undefined,
      subject: `New Quote Request — ${quote.customerName} | Ref #${quote.referenceId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#00a8cc,#00d4ff);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#000;font-size:20px;font-weight:900;">New Quote Request</h1>
            <p style="margin:4px 0 0;color:#000;opacity:0.6;font-size:13px;">Ref #${quote.referenceId}</p>
          </div>
          <div style="padding:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:140px;">Name</td><td style="color:#fff;font-weight:600;">${quote.customerName}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Phone</td><td><a href="tel:${quote.phoneNumber}" style="color:#00a8cc;">${quote.phoneNumber}</a></td></tr>
              ${quote.email ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Email</td><td><a href="mailto:${quote.email}" style="color:#00a8cc;">${quote.email}</a></td></tr>` : ''}
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Location</td><td style="color:#fff;">${quote.address}, ${quote.city} ${quote.postalCode}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Vehicle</td><td style="color:#fff;">${[quote.year, quote.make, quote.model].filter(Boolean).join(' ') || quote.vehicleType} (${quote.vehicleType})</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Condition</td><td style="color:#fff;">${quote.vehicleCondition}</td></tr>
              ${quote.packageName ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Package</td><td style="color:#fff;">${quote.packageName}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Services</td><td style="color:#fff;">${serviceList}</td></tr>
            </table>
            ${quote.notes ? `<div style="margin-top:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;"><p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">${quote.notes}</p></div>` : ''}
          </div>
          <div style="padding:16px 28px;background:rgba(0,168,204,0.08);text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Prestige Plus Services · info@prestigeplus.services · (438) 796-8001</p>
          </div>
        </div>`,
    });
  } catch (err) {
    console.error('Owner quote notification failed:', err.message);
  }
};

const sendCustomerQuoteReady = async (quote) => {
  if (!quote.email) return;
  try {
    const t = createTransporter();
    await t.sendMail({
      from: `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to:   quote.email,
      subject: `Your Quote is Ready — Ref #${quote.referenceId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#00a8cc,#00d4ff);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#000;font-size:20px;font-weight:900;">Your Quote is Ready</h1>
            <p style="margin:4px 0 0;color:#000;opacity:0.6;font-size:13px;">Ref #${quote.referenceId}</p>
          </div>
          <div style="padding:28px;">
            <p style="color:rgba(255,255,255,0.8);">Hi ${quote.customerName.split(' ')[0]}, your custom quote from Prestige Plus Services is ready.</p>
            <div style="text-align:center;margin:24px 0;padding:20px;background:rgba(0,168,204,0.08);border-radius:12px;border:1px solid rgba(0,168,204,0.2);">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:13px;">Your quoted price</p>
              <div style="font-size:40px;font-weight:900;background:linear-gradient(135deg,#00a8cc,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${Number(quote.quotedPrice).toFixed(2)}</div>
            </div>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;">To accept or check your quote status, visit:<br/>
              <a href="${process.env.FRONTEND_URL || 'https://prestigeplus.services'}/quote/lookup?ref=${quote.referenceId}" style="color:#00a8cc;">prestigeplus.services/quote/lookup?ref=${quote.referenceId}</a>
            </p>
          </div>
          <div style="padding:16px 28px;background:rgba(0,168,204,0.08);text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Prestige Plus Services · info@prestigeplus.services · (438) 796-8001</p>
          </div>
        </div>`,
    });
  } catch (err) {
    console.error('Customer quote-ready email failed:', err.message);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateRefId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'Q-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

const makeUniqueRef = async () => {
  let ref, exists = true;
  while (exists) {
    ref = generateRefId();
    exists = await prisma.quote.findUnique({ where: { referenceId: ref } });
  }
  return ref;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/quotes — public submission
router.post('/', async (req, res) => {
  try {
    const {
      customerName, phoneNumber, email,
      address, city, postalCode,
      vehicleType, vehicleCondition,
      make, model, year,
      packageId, packageName,
      services, addOns, notes,
    } = req.body;

    if (!customerName || !phoneNumber || !address || !city || !postalCode || !vehicleType || !vehicleCondition) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const referenceId = await makeUniqueRef();

    const quote = await prisma.quote.create({
      data: {
        referenceId,
        customerName:     customerName.trim(),
        phoneNumber:      phoneNumber.replace(/\D/g, '').slice(0, 15),
        email:            email?.trim() || null,
        address:          address.trim(),
        city:             city.trim(),
        postalCode:       postalCode.trim().toUpperCase(),
        vehicleType,
        vehicleCondition,
        make:             make?.trim() || null,
        model:            model?.trim() || null,
        year:             year ? parseInt(year) : null,
        packageId:        packageId ? parseInt(packageId) : null,
        packageName:      packageName?.trim() || null,
        services:         JSON.stringify(Array.isArray(services) ? services : []),
        addOns:           JSON.stringify(Array.isArray(addOns) ? addOns : []),
        notes:            notes?.trim() || null,
        status:           'NEW',
      },
    });

    // Fire-and-forget owner notification
    sendOwnerQuoteNotification(quote);

    return res.status(201).json({ success: true, referenceId: quote.referenceId, quote: {
      referenceId: quote.referenceId,
      status: quote.status,
      customerName: quote.customerName,
      createdAt: quote.createdAt,
    }});
  } catch (err) {
    console.error('Create quote error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit quote request.' });
  }
});

// GET /api/quotes/:referenceId — public status check
// Note: /admin/* routes are mounted BEFORE this in the same file, so Express
// will match /admin/all, /admin/count first. This route only fires for real ref IDs.
router.get('/:referenceId', async (req, res) => {
  try {
    const refParam = req.params.referenceId.toUpperCase();
    // Reject non-quote-style identifiers to avoid false matches
    if (!refParam.startsWith('Q-')) {
      return res.status(404).json({ success: false, message: 'Quote not found.' });
    }
    const quote = await prisma.quote.findUnique({
      where: { referenceId: refParam },
    });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });

    return res.json({ success: true, quote: {
      referenceId:  quote.referenceId,
      status:       quote.status,
      customerName: quote.customerName,
      vehicleType:  quote.vehicleType,
      vehicleCondition: quote.vehicleCondition,
      make:         quote.make,
      model:        quote.model,
      year:         quote.year,
      packageName:  quote.packageName,
      services:     (() => { try { return JSON.parse(quote.services); } catch { return []; } })(),
      quotedPrice:  quote.quotedPrice,
      bookingId:    quote.bookingId,
      createdAt:    quote.createdAt,
      updatedAt:    quote.updatedAt,
    }});
  } catch (err) {
    console.error('Get quote error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching quote.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/quotes/admin/all — admin list with optional status filter
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, quotes });
  } catch (err) {
    console.error('Admin get quotes error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching quotes.' });
  }
});

// PUT /api/quotes/admin/:id — update status/price/notes
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, quotedPrice, adminNotes } = req.body;
    const data = {};
    if (status)      data.status      = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (quotedPrice !== undefined && quotedPrice !== null && quotedPrice !== '') {
      data.quotedPrice = parseFloat(quotedPrice);
    }

    const quote = await prisma.quote.update({ where: { id }, data });

    // Notify customer if quote is ready and they have an email
    if (status === 'QUOTED' && quote.quotedPrice) {
      sendCustomerQuoteReady(quote);
    }

    return res.json({ success: true, quote });
  } catch (err) {
    console.error('Update quote error:', err);
    return res.status(500).json({ success: false, message: 'Error updating quote.' });
  }
});

// POST /api/quotes/admin/:id/convert — convert accepted quote to booking
router.post('/admin/:id/convert', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required to create a booking.' });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
    if (quote.status === 'CONVERTED') {
      return res.status(400).json({ success: false, message: 'Quote already converted.' });
    }

    // Generate a booking confirmation code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let confirmationCode;
    let codeExists = true;
    while (codeExists) {
      confirmationCode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      codeExists = await prisma.booking.findUnique({ where: { confirmationCode } });
    }

    const nameParts = quote.customerName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName  = nameParts.slice(1).join(' ') || '';

    const booking = await prisma.booking.create({
      data: {
        confirmationCode,
        status:           'CONFIRMED',
        firstName,
        lastName,
        phoneNumber:      quote.phoneNumber,
        email:            quote.email || '',
        address:          quote.address,
        city:             quote.city,
        postalCode:       quote.postalCode,
        vehicleType:      quote.vehicleType,
        vehicleCondition: quote.vehicleCondition,
        make:             quote.make || null,
        model:            quote.model || null,
        year:             quote.year || null,
        date:             new Date(date),
        time,
        services:         quote.services,
        packageId:        quote.packageId || null,
        totalPrice:       quote.quotedPrice || null,
        specialInstructions: quote.notes || null,
        propertyType:     '',
        hasWaterPower:    true,
        emailSent:        false,
        reminderSent:     false,
      },
    });

    // Link booking to quote and mark converted
    await prisma.quote.update({
      where: { id },
      data: { status: 'CONVERTED', bookingId: booking.id },
    });

    return res.json({ success: true, bookingId: booking.id, confirmationCode: booking.confirmationCode });
  } catch (err) {
    console.error('Convert quote error:', err);
    return res.status(500).json({ success: false, message: 'Error converting quote to booking.' });
  }
});

// GET /api/quotes/admin/count — quick count for sidebar badge
router.get('/admin/count', requireAdmin, async (req, res) => {
  try {
    const count = await prisma.quote.count({ where: { status: { in: ['NEW', 'REVIEWING'] } } });
    return res.json({ success: true, count });
  } catch (err) {
    return res.json({ success: true, count: 0 });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/quotes/admin/all — admin list with optional status filter
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, quotes });
  } catch (err) {
    console.error('Admin get quotes error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching quotes.' });
  }
});

// PUT /api/quotes/admin/:id — update status/price/notes
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, quotedPrice, adminNotes } = req.body;
    const data = {};
    if (status)      data.status      = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (quotedPrice !== undefined && quotedPrice !== null && quotedPrice !== '') {
      data.quotedPrice = parseFloat(quotedPrice);
    }

    const quote = await prisma.quote.update({ where: { id }, data });

    // Notify customer if quote is ready and they have an email
    if (status === 'QUOTED' && quote.quotedPrice) {
      sendCustomerQuoteReady(quote);
    }

    return res.json({ success: true, quote });
  } catch (err) {
    console.error('Update quote error:', err);
    return res.status(500).json({ success: false, message: 'Error updating quote.' });
  }
});

// POST /api/quotes/admin/:id/convert — convert accepted quote to booking
router.post('/admin/:id/convert', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required to create a booking.' });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
    if (quote.status === 'CONVERTED') {
      return res.status(400).json({ success: false, message: 'Quote already converted.' });
    }

    // Generate a booking confirmation code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let confirmationCode;
    let codeExists = true;
    while (codeExists) {
      confirmationCode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      codeExists = await prisma.booking.findUnique({ where: { confirmationCode } });
    }

    const nameParts = quote.customerName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName  = nameParts.slice(1).join(' ') || '';

    const booking = await prisma.booking.create({
      data: {
        confirmationCode,
        status:           'CONFIRMED',
        firstName,
        lastName,
        phoneNumber:      quote.phoneNumber,
        email:            quote.email || '',
        address:          quote.address,
        city:             quote.city,
        postalCode:       quote.postalCode,
        vehicleType:      quote.vehicleType,
        vehicleCondition: quote.vehicleCondition,
        make:             quote.make || null,
        model:            quote.model || null,
        year:             quote.year || null,
        date:             new Date(date),
        time,
        services:         quote.services,
        packageId:        quote.packageId || null,
        totalPrice:       quote.quotedPrice || null,
        specialInstructions: quote.notes || null,
        propertyType:     '',
        hasWaterPower:    true,
        emailSent:        false,
        reminderSent:     false,
      },
    });

    // Link booking to quote and mark converted
    await prisma.quote.update({
      where: { id },
      data: { status: 'CONVERTED', bookingId: booking.id },
    });

    return res.json({ success: true, bookingId: booking.id, confirmationCode: booking.confirmationCode });
  } catch (err) {
    console.error('Convert quote error:', err);
    return res.status(500).json({ success: false, message: 'Error converting quote to booking.' });
  }
});

// GET /api/quotes/admin/count — quick count for sidebar badge
router.get('/admin/count', requireAdmin, async (req, res) => {
  try {
    const count = await prisma.quote.count({ where: { status: { in: ['NEW', 'REVIEWING'] } } });
    return res.json({ success: true, count });
  } catch (err) {
    return res.json({ success: true, count: 0 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC GET — must come AFTER /admin/* routes to avoid capturing 'admin' as ref
// ─────────────────────────────────────────────────────────────────────────────



module.exports = router;
