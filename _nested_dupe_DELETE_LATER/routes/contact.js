// backend/routes/contact.js
// POST /api/contact — public endpoint, saves to DB + sends notification email
const express  = require('express');
const router   = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma   = new PrismaClient();

const sendContactNotification = async (contact) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Prestige Plus Services" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      replyTo: contact.email,
      subject: `New Contact Message — ${contact.subject || 'General Inquiry'} | #${contact.referenceId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#00a8cc,#00d4ff);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#000;font-size:20px;font-weight:900;">New Contact Message</h1>
            <p style="margin:6px 0 0;color:#000;opacity:0.6;font-size:13px;">Prestige Plus Services — Ref #${contact.referenceId}</p>
          </div>
          <div style="padding:28px;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px;width:120px;">From</td><td style="padding:8px 0;color:#fff;font-weight:600;">${contact.name}</td></tr>
              <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px;">Email</td><td style="padding:8px 0;"><a href="mailto:${contact.email}" style="color:#00a8cc;">${contact.email}</a></td></tr>
              ${contact.phone ? `<tr><td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px;">Phone</td><td style="padding:8px 0;"><a href="tel:${contact.phone}" style="color:#00a8cc;">${contact.phone}</a></td></tr>` : ''}
              <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px;">Subject</td><td style="padding:8px 0;color:#fff;">${contact.subject || 'General Inquiry'}</td></tr>
            </table>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:20px;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Message</p>
              <p style="margin:0;color:#fff;font-size:15px;line-height:1.6;white-space:pre-wrap;">${contact.message}</p>
            </div>
            <div style="text-align:center;">
              <a href="mailto:${contact.email}?subject=Re: ${contact.subject || 'Your inquiry'}" style="display:inline-block;background:linear-gradient(135deg,#00a8cc,#00d4ff);color:#000;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">Reply to ${contact.name}</a>
            </div>
          </div>
          <div style="padding:16px;text-align:center;border-top:1px solid rgba(255,255,255,0.07);">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">Manage in <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" style="color:#00a8cc;">Admin Panel</a> → Messages</p>
          </div>
        </div>`,
    });
  } catch (err) {
    console.error('Contact notification email failed:', err.message);
    // Don't throw — email failure shouldn't break the API response
  }
};

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message too long (max 5000 characters).' });
    }

    // Generate a short reference ID
    const referenceId = `C${Date.now().toString(36).toUpperCase().slice(-6)}`;

    const contact = await prisma.contact.create({
      data: {
        name:    String(name).trim().slice(0, 100),
        email:   String(email).trim().toLowerCase(),
        phone:   phone ? String(phone).trim().slice(0, 20) : null,
        subject: subject ? String(subject).trim().slice(0, 100) : null,
        message: String(message).trim(),
        status:  'NEW',
        referenceId,
      },
    });

    // Fire-and-forget notification email
    sendContactNotification(contact);

    res.json({ success: true, referenceId });
  } catch (err) {
    console.error('POST /contact error:', err);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;
