// backend/jobs/scheduler.js
const cron = require('node-cron');
const { cleanupExpiredImages } = require('../services/imageCleanupService');

let started = false;

function startScheduler() {
  if (started) return;
  started = true;

  // Daily at 3:00 AM — delete expired temporary images
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running daily image cleanup...');
    try {
      const result = await cleanupExpiredImages();
      console.log('[Scheduler] Image cleanup complete:', result);
    } catch (err) {
      console.error('[Scheduler] Image cleanup error:', err.message);
    }
  }, { timezone: 'America/Toronto' });

  // Daily at 8:00 AM — send appointment reminders (24h ahead)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running appointment reminder check...');
    // TODO: implement reminderService.sendReminders()
  }, { timezone: 'America/Toronto' });

  // Daily at 6:00 PM — send post-job review requests
  cron.schedule('0 18 * * *', async () => {
    console.log('[Scheduler] Running review request check...');
    // TODO: implement reviewCollectionService.sendReviewRequests()
  }, { timezone: 'America/Toronto' });

  console.log('[Scheduler] ✅ All cron jobs registered');
}

module.exports = { startScheduler };
