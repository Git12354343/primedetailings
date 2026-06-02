// backend/services/weatherService.js — OpenWeatherMap integration for Montreal
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAT  = process.env.WEATHER_LAT  || '45.5017';
const LON  = process.env.WEATHER_LON  || '-73.5673';
const CITY = process.env.WEATHER_CITY || 'Montreal';

const BAD_CODES = new Set([
  200,201,202,210,211,212,221,230,231,232, // thunderstorm
  300,301,302,310,311,312,313,314,321,     // drizzle
  500,501,502,503,504,511,520,521,522,531, // rain
  600,601,602,611,612,613,615,616,620,621,622, // snow
  781,                                     // tornado
]);
const TEMP_TOO_COLD = 0; // Celsius
const TEMP_TOO_HOT  = 35;

const fetchWeather = (date) => new Promise((resolve, reject) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return resolve(null);

  // Use 5-day forecast (free tier)
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${apiKey}&units=metric&cnt=40`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve(null); }
    });
  }).on('error', reject);
});

const checkTomorrowsJobs = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const bookings = await prisma.booking.findMany({
    where: {
      date: new Date(dateStr + 'T12:00:00'),
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { id: true, confirmationCode: true, time: true },
  });

  if (!bookings.length) return { bookings: 0, alerts: [] };

  const weatherData = await fetchWeather(dateStr).catch(() => null);
  if (!weatherData?.list) return { bookings: bookings.length, alerts: [], weatherUnavailable: true };

  const alerts = [];
  // Find forecast entry closest to noon tomorrow
  const target = new Date(dateStr + 'T12:00:00').getTime();
  const closest = weatherData.list.reduce((a, b) =>
    Math.abs(new Date(b.dt * 1000) - target) < Math.abs(new Date(a.dt * 1000) - target) ? b : a
  );

  const code = closest.weather?.[0]?.id;
  const temp = closest.main?.temp;
  const desc = closest.weather?.[0]?.description;

  if (code && BAD_CODES.has(code)) alerts.push({ type: 'PRECIPITATION', desc, icon: '🌧' });
  if (temp !== undefined && temp < TEMP_TOO_COLD) alerts.push({ type: 'COLD', temp: Math.round(temp), icon: '🥶' });
  if (temp !== undefined && temp > TEMP_TOO_HOT) alerts.push({ type: 'HOT', temp: Math.round(temp), icon: '🌡' });

  // Store in AppConfig for admin dashboard
  await prisma.appConfig.upsert({
    where: { key: 'weather_alert' },
    create: { key: 'weather_alert', value: { date: dateStr, alerts, city: CITY, temp, desc, bookingCount: bookings.length, checkedAt: new Date().toISOString() } },
    update: { value: { date: dateStr, alerts, city: CITY, temp, desc, bookingCount: bookings.length, checkedAt: new Date().toISOString() } },
  }).catch(() => {});

  return { bookings: bookings.length, alerts, date: dateStr, temp, desc };
};

module.exports = { checkTomorrowsJobs };
