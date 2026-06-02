// backend/routes/auth.js
const express = require('express');
const { loginDetailer, verifyDetailer, logoutDetailer, refreshDetailerToken } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.post('/login',   loginDetailer);
router.post('/refresh', refreshDetailerToken);
router.get('/verify',   verifyToken, verifyDetailer);
router.post('/logout',  verifyToken, logoutDetailer);

module.exports = router;