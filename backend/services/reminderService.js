/**
 * reminderService.js
 *
 * Changes from original:
 *  - Uses startAt range query instead of date equality (fixes H3 — was matching 0 bookings)
 *  - Falls back to date column range for legacy rows without startAt
 *  - All "tomorrow" bounds computed in America/Toronto (DST-safe via luxon)
 *  - Logs confirmation codes of bookings found so you can verify it's firing
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const { DateTime }     = require('luxon');
const { sms }          = require('./smsService');

const prisma = new PrismaClient();
const TZ     = 'America/Toronto';

const sendReminders = async () => {
  // ── Compute tomorrow's window in Toronto time ───────────────────────────────
  const torontoNow       = DateTime.now().setZone(TZ);
  const tomorrowStart    = torontoNow.plus({ days: 1 }).startOf('day');
  const tomorrowEnd      = tomorrowStart.endOf('day');

  const windowStart = tomorrowStart.toJSDate();
  const windowEnd   = tomorrowEnd.toJSDate();

  console.log(`[Reminder] Searching for bookings on ${tomorrowStart.toISODate()} (Toronto)`);

  // ── Find bookings using startAt (new) OR date column (legacy) ──────────────
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        // New rows with startAt populated
        {
          startAt:      { gte: windowStart, lte: windowEnd },
          status:       { in: ['PENDING', 'CONFIRMED'] },
          reminderSent: false,
        },
        // Legacy rows without startAt — fall back to date column
        {
          startAt: null,
          date:    { gte: windowStart, lte: windowEnd },
          status:  { in: ['PENDING', 'CONFIRMED'] },
          reminderSent: false,
        },
      ],
    },
    select: {
      id:               true,
      confirmationCode: true,
      firstName:        true,
      phoneNumber:      true,
      date:             true,
      time:             true,
      startAt:          true,
      address:          true,
      city:             true,
    },
  });

  console.log(
    `[Reminder] Found ${bookings.length} booking(s): ` +
    bookings.map(b => b.confirmationCode).join(', ')
  );

  let sent = 0;
  for (const b of bookings) {
    if (!b.phoneNumber) continue;

    const result = await sms.bookingReminder({
      firstName:   b.firstName,
      phoneNumber: b.phoneNumber,
      date:        b.startAt || b.date,
      time:        b.time,
      address:     b.address,
      city:        b.city,
      id:          b.id,
    });

    if (result.ok) {
      await prisma.booking.update({
        where: { id: b.id },
        data:  { reminderSent: true },
      });
      sent++;
      console.log(`[Reminder] ✅ Sent to ${b.confirmationCode}`);
    } else {
      console.error(`[Reminder] ❌ Failed for ${b.confirmationCode}: ${result.error}`);
    }
  }

  console.log(`[Reminder] Sent ${sent}/${bookings.length} reminders`);
  return { sent, total: bookings.length };
};

module.exports = { sendReminders };
