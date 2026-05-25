// backend/routes/fleet.js
const express  = require('express');
const router   = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/middleware');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

const sendFleetNotification = async (quote) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Prime Detailing" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      replyTo: quote.email,
      subject: `New Fleet Quote Request — ${quote.companyName} | Ref #${quote.referenceId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#c9a84c,#f5d376);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#000;font-size:20px;font-weight:900;">New Fleet Quote Request</h1>
            <p style="margin:4px 0 0;color:#000;opacity:0.6;font-size:13px;">Ref #${quote.referenceId}</p>
          </div>
          <div style="padding:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;width:140px;">Company</td><td style="color:#fff;font-weight:600;">${quote.companyName}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Contact</td><td style="color:#fff;">${quote.contactName}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Email</td><td><a href="mailto:${quote.email}" style="color:#c9a84c;">${quote.email}</a></td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Phone</td><td><a href="tel:${quote.phone}" style="color:#c9a84c;">${quote.phone}</a></td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Fleet Size</td><td style="color:#fff;">${quote.vehicleCount} vehicles</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Frequency</td><td style="color:#fff;">${quote.frequency}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">Services</td><td style="color:#fff;">${quote.servicesRequested}</td></tr>
            </table>
            ${quote.additionalNotes ? `<div style="margin-top:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;"><p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">${quote.additionalNotes}</p></div>` : ''}
          </div>
        </div>`,
    });
  } catch (err) {
    console.error('Fleet notification email failed:', err.message);
  }
};

// POST /api/fleet/quote — public submission
router.post('/quote', async (req, res) => {
  try {
    const {
      companyName, contactName, email, phone,
      vehicleCount, vehicleTypes, servicesRequested,
      frequency, preferredDays, locationAddress, additionalNotes,
    } = req.body;

    if (!companyName || !contactName || !email || !phone || !vehicleCount || !servicesRequested)
      return res.status(400).json({ success: false, error: 'Missing required fields.' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, error: 'Invalid email.' });

    const referenceId = `F${Date.now().toString(36).toUpperCase().slice(-7)}`;

    const quote = await prisma.fleetQuote.create({
      data: {
        referenceId,
        companyName:       String(companyName).trim().slice(0, 150),
        contactName:       String(contactName).trim().slice(0, 100),
        email:             String(email).trim().toLowerCase(),
        phone:             String(phone).trim().slice(0, 20),
        vehicleCount:      parseInt(vehicleCount),
        vehicleTypes:      Array.isArray(vehicleTypes) ? vehicleTypes : [],
        servicesRequested: String(servicesRequested).trim(),
        frequency:         frequency || 'ONE_TIME',
        preferredDays:     preferredDays || null,
        locationAddress:   locationAddress || null,
        additionalNotes:   additionalNotes || null,
      },
    });

    sendFleetNotification(quote);

    res.json({ success: true, referenceId: quote.referenceId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fleet/quote/:referenceId — public status check
router.get('/quote/:referenceId', async (req, res) => {
  try {
    const quote = await prisma.fleetQuote.findUnique({
      where: { referenceId: req.params.referenceId },
      select: { referenceId: true, companyName: true, status: true, createdAt: true },
    });
    if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });
    res.json({ success: true, quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fleet/admin/quotes — admin list
router.get('/admin/quotes', requireAdmin, async (req, res) => {
  try {
    const quotes = await prisma.fleetQuote.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/fleet/admin/quotes/:id — update status/notes/value
router.put('/admin/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, estimatedValue } = req.body;
    const quote = await prisma.fleetQuote.update({
      where: { id: req.params.id },
      data: { status, adminNotes, estimatedValue },
    });
    res.json({ success: true, quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/fleet/admin/quotes/:id
router.delete('/admin/quotes/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.fleetQuote.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
