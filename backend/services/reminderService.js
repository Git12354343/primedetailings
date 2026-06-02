// backend/services/reminderService.js — day-of-service SMS reminders
const { PrismaClient } = require('@prisma/client');
const { sms } = require('./smsService');
const prisma = new PrismaClient();

const sendReminders = async () => {
  // Target bookings for tomorrow (America/Toronto)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const bookings = await prisma.booking.findMany({
    where: {
      date: new Date(tomorrowStr + 'T12:00:00'),
      status: { in: ['PENDING', 'CONFIRMED'] },
      reminderSent: false,
    }
  });

  console.log(`[Reminder] Found ${bookings.length} bookings for ${tomorrowStr}`);
  let sent = 0;

  for (const b of bookings) {
    if (!b.phoneNumber) continue;
    const result = await sms.bookingReminder({
      firstName: b.firstName,
      phoneNumber: b.phoneNumber,
      date: b.date,
      time: b.time,
      address: b.address,
      city: b.city,
      id: b.id,
    });

    if (result.ok) {
      await prisma.booking.update({ where: { id: b.id }, data: { reminderSent: true } });
      sent++;
    }
  }
  console.log(`[Reminder] Sent ${sent}/${bookings.length} reminders`);
  return { sent, total: bookings.length };
};

module.exports = { sendReminders };
