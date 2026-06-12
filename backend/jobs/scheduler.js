/**
 * scheduler.js
 *
 * Changes from original:
 *  - Added: pending-booking expiry cron (every 2 hours)
 *  - Added: 6:00 PM weather check for two days ahead (in addition to tomorrow)
 *  - Kept:  all existing crons (image cleanup, reminder, review requests, weather)
 *  - All crons remain pinned to America/Toronto
 */

'use strict';

const cron = require('node-cron');
const { cleanupExpiredImages }       = require('../services/imageCleanupService');
const { sendReminders }              = require('../services/reminderService');
const { sendReviewRequests }         = require('../services/reviewService');
const { checkTomorrowsJobs }         = require('../services/weatherService');
const { expirePendingBookings }      = require('../services/pendingExpiryService');
const { recoverAbandonedBookings }   = require('../services/abandonedRecoveryService');
const { runLifecycleAutomations }    = require('../services/lifecycleService');

let started = false;

function startScheduler() {
  if (started) return;
  started = true;

  // Every 2 hours — expire PENDING bookings that were never confirmed
  // (keeps slots clean; threshold controlled by PENDING_EXPIRY_HOURS env var)
  cron.schedule('0 */2 * * *', async () => {
    console.log('[Scheduler] Pending expiry check...');
    try {
      const r = await expirePendingBookings();
      console.log('[Scheduler] Pending expiry:', r);
    } catch (e) {
      console.error('[Scheduler] Pending expiry error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  // 3:00 AM — delete expired temporary images
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Image cleanup...');
    try {
      const r = await cleanupExpiredImages();
      console.log('[Scheduler] Cleanup:', r);
    } catch (e) {
      console.error('[Scheduler] Cleanup error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  // 8:00 AM — send day-of-service SMS reminders (for TODAY's jobs)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Appointment reminders...');
    try {
      const r = await sendReminders();
      console.log('[Scheduler] Reminders:', r);
    } catch (e) {
      console.error('[Scheduler] Reminder error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  // 6:00 PM — weather check for TOMORROW's jobs (early enough to notify customers)
  cron.schedule('0 18 * * *', async () => {
    console.log('[Scheduler] Weather check (tomorrow)...');
    try {
      const r = await checkTomorrowsJobs({ daysAhead: 1 });
      console.log('[Scheduler] Weather tomorrow:', r);
    } catch (e) {
      console.error('[Scheduler] Weather error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  // 6:00 PM — weather check for DAY AFTER TOMORROW (early warning)
  cron.schedule('0 18 * * *', async () => {
    try {
      const r = await checkTomorrowsJobs({ daysAhead: 2 });
      if (r?.alerts?.length) console.log('[Scheduler] Weather 2-day warning:', r);
    } catch { /* non-critical */ }
  }, { timezone: 'America/Toronto' });

  // 6:00 PM — send post-job review requests (was already at 6 PM — kept)
  cron.schedule('0 18 * * *', async () => {
    console.log('[Scheduler] Review requests...');
    try {
      const r = await sendReviewRequests();
      console.log('[Scheduler] Reviews:', r);
    } catch (e) {
      console.error('[Scheduler] Review error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  // Every hour at :30 — abandoned booking recovery (service enforces 9–20h quiet hours)
  cron.schedule('30 * * * *', async () => {
    try {
      const r = await recoverAbandonedBookings();
      if (r?.sent) console.log('[Scheduler] Abandoned recovery:', r);
    } catch (e) {
      console.error('[Scheduler] Abandoned recovery error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  // 10:00 AM — lifecycle automations (ceramic follow-ups, maintenance reminders, reactivation)
  cron.schedule('0 10 * * *', async () => {
    console.log('[Scheduler] Lifecycle automations...');
    try {
      const r = await runLifecycleAutomations();
      console.log('[Scheduler] Lifecycle:', r);
    } catch (e) {
      console.error('[Scheduler] Lifecycle error:', e.message);
    }
  }, { timezone: 'America/Toronto' });

  console.log('[Scheduler] ✅ All cron jobs registered (America/Toronto)');
}

module.exports = { startScheduler };
