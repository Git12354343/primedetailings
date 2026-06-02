// backend/services/icsService.js — RFC 5545 ICS generation (no external deps)
const formatDt = (d, t) => {
  const dt = new Date(`${String(d).split('T')[0]}T${t || '09:00'}:00`);
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};
const esc = (s) => String(s || '').replace(/[,;\\]/g, m => '\\' + m).replace(/\n/g, '\\n');
const fold = (line) => {
  const out = []; let cur = '';
  for (const ch of line) {
    if (cur.length >= 75) { out.push(cur); cur = ' '; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out.join('\r\n');
};

const generateBookingIcs = (booking) => {
  const dateStr = String(booking.date).split('T')[0];
  const start = formatDt(dateStr, booking.time);
  // approximate +2h
  const endDt  = new Date(`${dateStr}T${booking.time || '09:00'}:00`);
  endDt.setHours(endDt.getHours() + (booking.estimatedDuration || 2));
  const end = endDt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `booking-${booking.confirmationCode}@prestigeplus.services`;
  const summary = `Prestige Plus Details — ${booking.vehicleType || ''}`;
  const location = `${booking.address}, ${booking.city}, ${booking.postalCode}`;
  const desc = [
    `Confirmation: ${booking.confirmationCode}`,
    `Service: ${booking.services || ''}`,
    `Track: https://prestigeplus.services/lookup`,
    `Questions? (438) 796-8001`,
  ].join('\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prestige Plus Services//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    fold(`SUMMARY:${esc(summary)}`),
    fold(`LOCATION:${esc(location)}`),
    fold(`DESCRIPTION:${esc(desc)}`),
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
};

module.exports = { generateBookingIcs };
