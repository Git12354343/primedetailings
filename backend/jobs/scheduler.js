// backend/jobs/scheduler.js
const cron = require('node-cron');
const { cleanupExpiredImages } = require('../services/imageCleanupService');
const { sendReminders }        = require('../services/reminderService');
const { sendReviewRequests }   = require('../services/reviewService');
const { checkTomorrowsJobs }   = require('../services/weatherService');

let started = false;

function startScheduler() {
  if (started) return;
  started = true;

  // 3:00 AM — delete expired temporary images
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Image cleanup...');
    try { const r = await cleanupExpiredImages(); console.log('[Scheduler] Cleanup:', r); }
    catch (e) { console.error('[Scheduler] Cleanup error:', e.message); }
  }, { timezone: 'America/Toronto' });

  // 8:00 AM — send day-of-service SMS reminders
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Appointment reminders...');
    try { const r = await sendReminders(); console.log('[Scheduler] Reminders:', r); }
    catch (e) { console.error('[Scheduler] Reminder error:', e.message); }
  }, { timezone: 'America/Toronto' });

  // 6:00 PM — send post-job review requests
  cron.schedule('0 18 * * *', async () => {
    console.log('[Scheduler] Review requests...');
    try { const r = await sendReviewRequests(); console.log('[Scheduler] Reviews:', r); }
    catch (e) { console.error('[Scheduler] Review error:', e.message); }
  }, { timezone: 'America/Toronto' });

  // 7:00 PM — weather check for tomorrow's jobs
  cron.schedule('0 19 * * *', async () => {
    console.log('[Scheduler] Weather check...');
    try { const r = await checkTomorrowsJobs(); console.log('[Scheduler] Weather:', r); }
    catch (e) { console.error('[Scheduler] Weather error:', e.message); }
  }, { timezone: 'America/Toronto' });

  console.log('[Scheduler] ✅ All cron jobs registered');
}

module.exports = { startScheduler };
