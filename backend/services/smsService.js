// backend/services/smsService.js — Twilio SMS with logging + templates
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SITE = process.env.FRONTEND_URL || 'https://prestigeplus.services';

// ── Twilio client (lazy) ──────────────────────────────────────────────────────
let _twilio = null;
const getTwilio = () => {
  if (!_twilio) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error('Twilio credentials not configured');
    _twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return _twilio;
};

// ── Core send + log ───────────────────────────────────────────────────────────
const send = async (toRaw, body, messageType = 'GENERIC', entityType = null, entityId = null) => {
  const to = normalisePhone(toRaw);
  if (!to) { console.warn('[SMS] Invalid phone:', toRaw); return { ok: false, error: 'Invalid phone' }; }

  let sid, error;
  try {
    const msg = await getTwilio().messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    sid = msg.sid;
    console.log(`[SMS] Sent ${messageType} to ${to} (${sid})`);
  } catch (e) {
    error = e.message;
    console.error(`[SMS] Failed ${messageType} to ${to}:`, error);
  }

  // Log every attempt
  await prisma.smsLog.create({
    data: { toNumber: to, messageType, body, status: error ? 'FAILED' : 'SENT',
            sid: sid || null, error: error || null,
            entityType: entityType || null, entityId: entityId ? String(entityId) : null }
  }).catch(() => {});

  return { ok: !error, sid, error };
};

// ── Phone normaliser ──────────────────────────────────────────────────────────
const normalisePhone = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return null;
};

// ── Message templates ─────────────────────────────────────────────────────────
const templates = {
  // Booking
  bookingConfirmed: (b) =>
    `Hi ${b.firstName}, your Prestige Plus Services appointment is confirmed!\n` +
    `📅 ${formatDate(b.date)} at ${b.time}\n` +
    `📍 ${b.address}, ${b.city}\n` +
    `Code: ${b.confirmationCode}\n` +
    `Track: ${SITE}/lookup`,

  bookingReminder: (b) =>
    `Hi ${b.firstName}, reminder: your detail is TOMORROW at ${b.time}.\n` +
    `📍 ${b.address}, ${b.city}\n` +
    `Qs? Call (438) 796-8001. Track: ${SITE}/lookup`,

  bookingRescheduled: (b) =>
    `Hi ${b.firstName}, your booking has been rescheduled.\n` +
    `New: ${formatDate(b.date)} at ${b.time}\n` +
    `Code: ${b.confirmationCode}. Track: ${SITE}/lookup`,

  bookingCancelled: (b) =>
    `Hi ${b.firstName}, your booking (${b.confirmationCode}) has been cancelled.\n` +
    `Book again anytime: ${SITE}/booking`,

  reviewRequest: (b, reviewUrl) =>
    `Hi ${b.firstName}, thanks for choosing Prestige Plus!\n` +
    `We'd love a quick review:\n${reviewUrl}\nTakes 30 seconds — it means a lot!`,

  // Quotes
  quoteReady: (q) =>
    `Hi ${q.customerName.split(' ')[0]}, your Prestige Plus quote is ready!\n` +
    `Price: $${Number(q.quotedPrice).toFixed(2)}\n` +
    `Ref: ${q.referenceId}\n` +
    `View & accept: ${SITE}/quote/lookup?ref=${q.referenceId}`,

  quoteAccepted: (q) =>
    `Great news! Quote ${q.referenceId} has been ACCEPTED.\n` +
    `We'll be in touch to confirm your appointment. (438) 796-8001`,

  quoteDeclined: (q) =>
    `Quote ${q.referenceId} has been declined.\n` +
    `Questions? Call (438) 796-8001 or email info@prestigeplus.services`,

  quoteChangeRequested: (q) =>
    `Hi ${q.customerName.split(' ')[0]}, change request received for quote ${q.referenceId}.\n` +
    `Note: ${q.changeRequestNote || '(no note)'}\n` +
    `We'll update shortly.`,

  quoteExpiring: (q) =>
    `Hi ${q.customerName.split(' ')[0]}, your Prestige Plus quote ${q.referenceId} expires in 48h.\n` +
    `View & accept: ${SITE}/quote/lookup?ref=${q.referenceId}`,
};

// ── Convenience functions ──────────────────────────────────────────────────────
const sms = {
  // Bookings
  bookingConfirmed:    (b) => send(b.phoneNumber,  templates.bookingConfirmed(b),    'BOOKING_CONFIRMED',  'booking', b.id),
  bookingReminder:     (b) => send(b.phoneNumber,  templates.bookingReminder(b),     'BOOKING_REMINDER',   'booking', b.id),
  bookingRescheduled:  (b) => send(b.phoneNumber,  templates.bookingRescheduled(b),  'BOOKING_RESCHEDULED','booking', b.id),
  bookingCancelled:    (b) => send(b.phoneNumber,  templates.bookingCancelled(b),    'BOOKING_CANCELLED',  'booking', b.id),
  reviewRequest:       (b, url) => send(b.phoneNumber, templates.reviewRequest(b, url), 'REVIEW_REQUEST', 'booking', b.id),

  // Quotes (owner)
  ownerNewQuote:       (q) => send(process.env.BUSINESS_PHONE, `New quote request from ${q.customerName} (${q.vehicleType}). Ref: ${q.referenceId}. View: ${SITE}/admin`, 'OWNER_NEW_QUOTE', 'quote', q.id),

  // Quotes (customer)
  quoteReady:          (q) => send(q.phoneNumber, templates.quoteReady(q),           'QUOTE_READY',        'quote', q.id),
  quoteDeclined:       (q) => send(q.phoneNumber, templates.quoteDeclined(q),        'QUOTE_DECLINED',     'quote', q.id),
  quoteChangeRequested:(q) => send(q.phoneNumber, templates.quoteChangeRequested(q), 'QUOTE_CHANGE',       'quote', q.id),
  quoteExpiring:       (q) => send(q.phoneNumber, templates.quoteExpiring(q),        'QUOTE_EXPIRING',     'quote', q.id),

  // Owner notification for accepted quote
  ownerQuoteAccepted:  (q) => send(process.env.BUSINESS_PHONE,
    `Quote ${q.referenceId} ACCEPTED by ${q.customerName}!\nDate pref: ${q.preferredDate || 'none'} ${q.preferredTime || ''}\nConvert: ${SITE}/admin`,
    'OWNER_QUOTE_ACCEPTED', 'quote', q.id),
};

const formatDate = (d) => {
  try {
    return new Date(d + (String(d).includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-CA', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  } catch { return String(d); }
};

module.exports = { sms, send, normalisePhone };
