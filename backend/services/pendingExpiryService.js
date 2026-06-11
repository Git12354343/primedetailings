/**
 * pendingExpiryService.js  (NEW)
 *
 * Expires PENDING bookings that were never confirmed by the admin.
 * Without this, an abandoned booking holds its slot forever
 * (maxBookingsPerSlot:1 means the slot becomes permanently unavailable).
 *
 * Strategy:
 *   - PENDING bookings older than PENDING_EXPIRY_HOURS are set to CANCELED
 *     with a system reason so they're identifiable in audit.
 *   - In-progress jobs (EN_ROUTE / STARTED / IN_PROGRESS) are never expired.
 *   - Run by the scheduler every 2 hours.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// How long a PENDING booking holds a slot before it's released.
// Set via env var PENDING_EXPIRY_HOURS (default 2 hours).
const EXPIRY_HOURS = parseInt(process.env.PENDING_EXPIRY_HOURS || '2', 10);

const expirePendingBookings = async () => {
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

  const expired = await prisma.booking.findMany({
    where: {
      status:    'PENDING',
      createdAt: { lt: cutoff },
    },
    select: { id: true, confirmationCode: true, createdAt: true },
  });

  if (expired.length === 0) {
    console.log('[PendingExpiry] No expired pending bookings found');
    return { expired: 0 };
  }

  console.log(`[PendingExpiry] Expiring ${expired.length} pending booking(s): ${expired.map(b => b.confirmationCode).join(', ')}`);

  // Bulk cancel
  await prisma.booking.updateMany({
    where: { id: { in: expired.map(b => b.id) } },
    data: {
      status:             'CANCELED',
      cancellationReason: `Auto-expired: not confirmed within ${EXPIRY_HOURS}h`,
      updatedAt:          new Date(),
    },
  });

  // Audit trail for each (best-effort, non-blocking)
  for (const b of expired) {
    await prisma.bookingHistory.create({
      data: {
        bookingId:   b.id,
        action:      'EXPIRED',
        oldStatus:   'PENDING',
        newStatus:   'CANCELED',
        reason:      `Auto-expired after ${EXPIRY_HOURS}h`,
        initiatedBy: 'system',
      },
    }).catch(() => {});
  }

  console.log(`[PendingExpiry] ✅ Expired ${expired.length} booking(s)`);
  return { expired: expired.length, codes: expired.map(b => b.confirmationCode) };
};

module.exports = { expirePendingBookings };
