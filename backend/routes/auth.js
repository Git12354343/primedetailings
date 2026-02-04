// backend/routes/auth.js
const express = require('express');
const { loginDetailer, verifyDetailer } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Login route
router.post('/login', loginDetailer);

// Verify token route (protected)
router.get('/verify', verifyToken, verifyDetailer);

module.exports = router;