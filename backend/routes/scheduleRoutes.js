const express = require('express');
const {
  getScheduleConfig,
  updateScheduleConfig,
  blockDate,
  unblockDate,
  getBlockedDates
} = require('../controllers/scheduleController');

const router = express.Router();

router.get('/config', getScheduleConfig);
router.put('/config', updateScheduleConfig);
router.get('/blocked-dates', getBlockedDates);
router.post('/blocked-dates', blockDate);
router.delete('/blocked-dates/:date', unblockDate);

module.exports = router;