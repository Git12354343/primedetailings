// backend/services/reviewService.js — automated review request after job completion
const { PrismaClient } = require('@prisma/client');
const { sms } = require('./smsService');
const emailService = require('./emailService');
const prisma = new PrismaClient();

const DEFAULT_DELAY_DAYS = 1;
const DEFAULT_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_GOOGLE_REVIEW_LINK';

const getConfig = async () => {
  try {
    const c = await prisma.appConfig.findUnique({ where: { key: 'review_requests' } });
    return c?.value || {};
  } catch { return {}; }
};

const sendReviewRequests = async () => {
  const config = await getConfig();
  if (config.enabled === false) { console.log('[Review] Disabled in config'); return { sent: 0 }; }
  const delayDays = config.delayDays || DEFAULT_DELAY_DAYS;
  const reviewUrl = config.reviewUrl || DEFAULT_REVIEW_URL;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - delayDays);

  // Bookings completed before cutoff with no review request yet
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { lte: cutoff },
      reviewRequestSent: false,
    },
    take: 50,
  });

  console.log(`[Review] ${bookings.length} eligible bookings`);
  let sent = 0;

  for (const b of bookings) {
    let smsOk = false, emailOk = false;

    if (b.phoneNumber) {
      const r = await sms.reviewRequest({ firstName: b.firstName, phoneNumber: b.phoneNumber, id: b.id }, reviewUrl);
      smsOk = r.ok;
    }

    if (b.email) {
      try {
        await emailService.sendReviewRequest?.(b, reviewUrl);
        emailOk = true;
      } catch {}
    }

    await prisma.booking.update({
      where: { id: b.id }, data: { reviewRequestSent: true }
    });

    // Log it
    await prisma.reviewRequest.upsert({
      where: { bookingId: b.id },
      create: { bookingId: b.id, smsStatus: smsOk ? 'SENT' : (b.phoneNumber ? 'FAILED' : 'SKIPPED'),
                emailStatus: emailOk ? 'SENT' : (b.email ? 'FAILED' : 'SKIPPED'), sentAt: new Date() },
      update: { smsStatus: smsOk ? 'SENT' : 'FAILED', emailStatus: emailOk ? 'SENT' : 'FAILED', sentAt: new Date() }
    }).catch(() => {});
    sent++;
  }

  console.log(`[Review] Processed ${sent} requests`);
  return { sent, total: bookings.length };
};

module.exports = { sendReviewRequests };
