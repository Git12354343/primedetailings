const express = require('express');
const {
  getScheduleConfig,
  updateScheduleConfig,
  blockDate,
  unblockDate,
  getBlockedDates
} = require('../controllers/scheduleController');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/config', getScheduleConfig);
router.put('/config', requireAdmin, updateScheduleConfig);
router.get('/blocked-dates', getBlockedDates);
router.post('/blocked-dates', requireAdmin, blockDate);
router.delete('/blocked-dates/:date', requireAdmin, unblockDate);

module.exports = router;
