// backend/services/abandonedRecoveryService.js
// Recovers abandoned bookings. When a customer reaches the final booking step
// we already store their full bookingData alongside the SMS verification code.
// If they never verify, that's a hot lead going cold — this service nudges
// them once via SMS (+ email when available) a couple of hours later.
//
// Guard rails:
//  - one nudge per attempt (recoverySentAt flag), never repeated
//  - only attempts 2–24h old (older = stale, fresher = may still finish)
//  - skipped entirely if the customer completed a booking after the attempt
//  - quiet hours respected (sends only 9:00–20:00 America/Toronto)

const prisma       = require('../prisma/lib/prisma_lib');
const { DateTime } = require('luxon');
const { send }     = require('./smsService');
const emailService = require('./emailService');

const SITE = process.env.FRONTEND_URL || 'https://prestigeplus.services';
const TZ   = 'America/Toronto';

const recoverAbandonedBookings = async () => {
  const nowToronto = DateTime.now().setZone(TZ);
  if (nowToronto.hour < 9 || nowToronto.hour >= 20) {
    return { skipped: 'quiet hours', sent: 0 };
  }

  const now = new Date();
  const candidates = await prisma.verificationCode.findMany({
    where: {
      expiresAt:      { lt: now },                                  // code expired = never verified
      recoverySentAt: null,
      bookingData:    { not: null },
      createdAt: {
        lt:  new Date(now.getTime() -  2 * 3600 * 1000),            // at least 2h old
        gt:  new Date(now.getTime() - 24 * 3600 * 1000),            // at most 24h old
      },
    },
  });

  let sent = 0;
  for (const vc of candidates) {
    let data = {};
    try { data = JSON.parse(vc.bookingData || '{}'); } catch { /* ignore */ }
    const firstName = data.firstName || data.displayName?.split(' ')[0] || '';

    // If they finished a booking after this attempt, leave them alone.
    const digits = vc.phoneNumber.replace(/\D/g, '').slice(-10);
    const completedAfter = digits
      ? await prisma.booking.findFirst({
          where: { phoneNumber: { contains: digits }, createdAt: { gte: vc.createdAt } },
          select: { id: true },
        })
      : null;

    // Mark first so a crash can't double-send.
    await prisma.verificationCode.update({
      where: { id: vc.id },
      data:  { recoverySentAt: now },
    });

    if (completedAfter) continue;

    const body =
      `Hi ${firstName || 'there'}, your Prestige Plus booking wasn't finished — ` +
      `your spot may still be available!\n` +
      `Finish in under a minute: ${SITE}/booking\n` +
      `Need help? Call (438) 796-8001`;

    const result = await send(vc.phoneNumber, body, 'ABANDONED_RECOVERY', 'verification', vc.id);
    if (result?.ok) sent++;

    if (data.email) {
      emailService.sendLifecycleEmail({
        email:     data.email,
        firstName,
        subject:   'Your booking is almost done — your spot may still be available',
        heading:   'Finish Your Booking',
        bodyHtml:  `<p>You were one step away from booking your detail${data.date ? ` for <strong style="color:#fff;">${data.date}</strong>` : ''}. Your selection is still available — it takes under a minute to finish.</p>`,
        ctaLabel:  'Complete My Booking',
        ctaUrl:    `${SITE}/booking`,
      }).catch(() => {});
    }
  }

  if (candidates.length) {
    console.log(`[abandonedRecovery] candidates:${candidates.length} sent:${sent}`);
  }
  return { candidates: candidates.length, sent };
};

module.exports = { recoverAbandonedBookings };
