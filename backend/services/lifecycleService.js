// backend/services/lifecycleService.js
// Post-service lifecycle automations:
//   1. Ceramic coating care guide        — 7 days after a ceramic job completes
//   2. Ceramic coating 6-month checkup   — 180 days after completion
//   3. Maintenance reminder              — 90 days after any completed detail
//   4. Customer reactivation             — 9 months inactive (consent-gated)
//
// Dedupe strategy: every send is recorded in sms_logs with a distinct
// messageType + entityType/entityId, and we check that log before sending.
// No schema changes needed, fully idempotent, safe to run daily.
//
// CASL note: 1–3 relate directly to a service the customer purchased
// (existing business relationship). 4 is marketing — it only goes to
// customers with marketingConsent = true.

const prisma       = require('../prisma/lib/prisma_lib');
const { DateTime } = require('luxon');
const { send }     = require('./smsService');
const emailService = require('./emailService');

const SITE = process.env.FRONTEND_URL || 'https://prestigeplus.services';
const TZ   = 'America/Toronto';

const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

const alreadySent = async (messageType, entityType, entityId) => {
  const row = await prisma.smsLog.findFirst({
    where: { messageType, entityType, entityId: String(entityId) },
    select: { id: true },
  });
  return !!row;
};

const isCeramic = (booking) => {
  const haystack = `${booking.services || ''} ${booking.package?.name || ''}`.toLowerCase();
  return haystack.includes('ceramic') || haystack.includes('céramique');
};

const hasLaterBooking = async (phoneNumber, after) => {
  const digits = (phoneNumber || '').replace(/\D/g, '').slice(-10);
  if (!digits) return false;
  const b = await prisma.booking.findFirst({
    where: {
      phoneNumber: { contains: digits },
      createdAt:   { gt: after },
      status:      { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: { id: true },
  });
  return !!b;
};

// ── 1 + 2. Ceramic follow-ups ────────────────────────────────────────────────
const sendCeramicFollowups = async () => {
  let sent = 0;

  // Completed ceramic jobs in the last year
  const ceramicJobs = (await prisma.booking.findMany({
    where: {
      status:      'COMPLETED',
      completedAt: { gte: daysAgo(370), lte: daysAgo(6) },
    },
    include: { package: { select: { name: true } } },
  })).filter(isCeramic);

  for (const b of ceramicJobs) {
    const completedDays = (Date.now() - new Date(b.completedAt).getTime()) / (24 * 3600 * 1000);

    // +7d care guide
    if (completedDays >= 7 && completedDays < 30 && !(await alreadySent('CERAMIC_CARE_7D', 'booking', b.id))) {
      const body =
        `Hi ${b.firstName}, your ceramic coating has fully cured! Quick care tips:\n` +
        `• Hand wash only (pH-neutral soap)\n` +
        `• No automatic car washes\n` +
        `• Avoid washing in direct sun\n` +
        `Full care guide & questions: (438) 796-8001 — Prestige Plus`;
      const r = await send(b.phoneNumber, body, 'CERAMIC_CARE_7D', 'booking', b.id);
      if (r?.ok) sent++;
      if (b.email) {
        emailService.sendLifecycleEmail({
          email: b.email, firstName: b.firstName,
          subject: 'Your ceramic coating is cured — here\'s how to care for it',
          heading: 'Ceramic Coating Care Guide',
          bodyHtml: `<p>Your coating has now fully cured. To keep that deep gloss for years:</p>
            <p style="text-align:left;">• <strong style="color:#fff;">Hand wash only</strong> with pH-neutral soap<br/>
            • <strong style="color:#fff;">Skip automatic car washes</strong> — brushes damage coatings<br/>
            • <strong style="color:#fff;">Wash in the shade</strong>, never in direct sunlight<br/>
            • <strong style="color:#fff;">Book a maintenance detail</strong> every 6 months to protect your investment</p>`,
          ctaLabel: 'Book a Maintenance Detail',
          ctaUrl: `${SITE}/booking`,
        }).catch(() => {});
      }
    }

    // +6mo checkup offer
    if (completedDays >= 180 && completedDays < 240 && !(await alreadySent('CERAMIC_CHECKUP_6M', 'booking', b.id))) {
      if (await hasLaterBooking(b.phoneNumber, new Date(b.completedAt))) continue;
      const body =
        `Hi ${b.firstName}, it's been 6 months since your ceramic coating — ` +
        `time for a maintenance detail to keep it performing like new.\n` +
        `Book: ${SITE}/booking — Prestige Plus`;
      const r = await send(b.phoneNumber, body, 'CERAMIC_CHECKUP_6M', 'booking', b.id);
      if (r?.ok) sent++;
    }
  }

  return sent;
};

// ── 3. Maintenance reminder (any completed detail, 90 days) ─────────────────
const sendMaintenanceReminders = async () => {
  let sent = 0;

  const jobs = await prisma.booking.findMany({
    where: {
      status:      'COMPLETED',
      completedAt: { gte: daysAgo(120), lte: daysAgo(90) },
    },
    include: { package: { select: { name: true } } },
  });

  for (const b of jobs) {
    if (isCeramic(b)) continue; // ceramic customers get their own sequence
    if (await alreadySent('MAINTENANCE_REMINDER', 'booking', b.id)) continue;
    if (await hasLaterBooking(b.phoneNumber, new Date(b.completedAt))) continue;

    const body =
      `Hi ${b.firstName}, it's been about 3 months since your last detail with Prestige Plus. ` +
      `Ready to bring back that fresh look?\n` +
      `Book in under a minute: ${SITE}/booking`;
    const r = await send(b.phoneNumber, body, 'MAINTENANCE_REMINDER', 'booking', b.id);
    if (r?.ok) sent++;

    if (b.email) {
      emailService.sendLifecycleEmail({
        email: b.email, firstName: b.firstName,
        subject: 'Time for a refresh? Your last detail was 3 months ago',
        heading: 'Ready for a Refresh?',
        bodyHtml: `<p>It's been about three months since we detailed your ${b.make || b.vehicleType || 'vehicle'}. Québec roads are tough on a finish — a maintenance detail now keeps it protected and looking new.</p>`,
        ctaLabel: 'Book My Detail',
        ctaUrl: `${SITE}/booking`,
      }).catch(() => {});
    }
  }

  return sent;
};

// ── 4. Reactivation — 9 months inactive, consent required ───────────────────
const sendReactivation = async () => {
  let sent = 0;

  let customers = [];
  try {
    customers = await prisma.customer.findMany({
      where: { marketingConsent: true },
      include: { bookings: { select: { id: true, createdAt: true, status: true } } },
    });
  } catch (err) {
    // Customer table not migrated yet — skip silently.
    return 0;
  }

  for (const c of customers) {
    const valid = c.bookings.filter(b => !['CANCELED', 'NO_SHOW'].includes(b.status));
    if (!valid.length) continue;
    const lastAt = valid.reduce((m, b) => (b.createdAt > m ? b.createdAt : m), valid[0].createdAt);
    const inactiveDays = (Date.now() - new Date(lastAt).getTime()) / (24 * 3600 * 1000);
    if (inactiveDays < 270 || inactiveDays > 330) continue;
    if (await alreadySent('REACTIVATION', 'customer', c.id)) continue;

    const body =
      `Hi ${c.firstName || 'there'}, it's been a while! We'd love to get your vehicle ` +
      `looking its best again.\n` +
      `Book with Prestige Plus: ${SITE}/booking\n` +
      `Reply STOP to opt out.`;
    const r = await send(c.phone, body, 'REACTIVATION', 'customer', c.id);
    if (r?.ok) sent++;
  }

  return sent;
};

// ── Daily entry point ─────────────────────────────────────────────────────────
const runLifecycleAutomations = async () => {
  const nowToronto = DateTime.now().setZone(TZ);
  if (nowToronto.hour < 9 || nowToronto.hour >= 20) {
    return { skipped: 'quiet hours' };
  }

  const results = {};
  try { results.ceramic      = await sendCeramicFollowups(); }     catch (e) { console.error('[lifecycle] ceramic:', e.message); }
  try { results.maintenance  = await sendMaintenanceReminders(); } catch (e) { console.error('[lifecycle] maintenance:', e.message); }
  try { results.reactivation = await sendReactivation(); }         catch (e) { console.error('[lifecycle] reactivation:', e.message); }

  console.log('[lifecycle] done:', JSON.stringify(results));
  return results;
};

module.exports = { runLifecycleAutomations, sendCeramicFollowups, sendMaintenanceReminders, sendReactivation };
