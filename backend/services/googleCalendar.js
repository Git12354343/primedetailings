const { google } = require('googleapis');

const getCalendarClient = () => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CALENDAR_ID) {
    return null; // Google Calendar not configured
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

const addBookingToCalendar = async (booking) => {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.log('⚠️ Google Calendar not configured — skipping');
    return null;
  }

  try {
    const startDate = new Date(booking.date);
    const [hourStr, period] = booking.time.split(' ');
    let [hours] = hourStr.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    startDate.setHours(hours, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 4); // 4-hour service

    const event = {
      summary: `🚗 Prime Detailing — ${booking.firstName} ${booking.lastName}`,
      description: [
        `Confirmation: #${booking.confirmationCode}`,
        `Phone: ${booking.phoneNumber}`,
        `Vehicle: ${booking.year} ${booking.make} ${booking.model} (${booking.vehicleType})`,
        `Address: ${booking.address}, ${booking.city}`,
        booking.totalPrice ? `Total: $${booking.totalPrice}` : '',
        booking.notes ? `Notes: ${booking.notes}` : ''
      ].filter(Boolean).join('\n'),
      location: `${booking.address}, ${booking.city}, ${booking.postalCode}`,
      start: { dateTime: startDate.toISOString(), timeZone: 'America/Toronto' },
      end: { dateTime: endDate.toISOString(), timeZone: 'America/Toronto' },
      colorId: '2', // Green
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
    });

    console.log(`✅ Google Calendar event created: ${response.data.id}`);
    return response.data.id;

  } catch (error) {
    console.error('❌ Google Calendar error:', error.message);
    return null; // Don't fail the booking if calendar fails
  }
};

const removeBookingFromCalendar = async (eventId) => {
  const calendar = getCalendarClient();
  if (!calendar || !eventId) return;

  try {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId
    });
    console.log(`✅ Google Calendar event removed: ${eventId}`);
  } catch (error) {
    console.error('❌ Google Calendar delete error:', error.message);
  }
};

module.exports = { addBookingToCalendar, removeBookingFromCalendar };