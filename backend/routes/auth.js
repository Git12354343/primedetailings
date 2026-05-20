// backend/routes/auth.js
const express = require('express');
const { loginDetailer, verifyDetailer, logoutDetailer } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Login route — now uses Supabase Auth under the hood
router.post('/login', loginDetailer);

// Verify token (protected)
router.get('/verify', verifyToken, verifyDetailer);

// Logout route — invalidates Supabase session
router.post('/logout', verifyToken, logoutDetailer);

module.exports = router;