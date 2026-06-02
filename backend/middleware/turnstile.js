// backend/middleware/turnstile.js — Cloudflare Turnstile verification
const https = require('https');

const verifyTurnstile = async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return next(); // graceful degradation if not configured

  const token = req.body?.turnstileToken || req.headers['x-turnstile-token'];
  if (!token) return res.status(400).json({ success: false, message: 'CAPTCHA verification required.' });

  const body = JSON.stringify({
    secret,
    response: token,
    remoteip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress,
  });

  const result = await new Promise((resolve) => {
    const req2 = https.request({
      hostname: 'challenges.cloudflare.com',
      path: '/turnstile/v0/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res2) => {
      let d = '';
      res2.on('data', c => d += c);
      res2.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    req2.on('error', () => resolve({}));
    req2.write(body); req2.end();
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: 'CAPTCHA verification failed. Please try again.' });
  }
  next();
};

module.exports = { verifyTurnstile };
