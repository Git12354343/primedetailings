// backend/controllers/authController.js
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');  // ← ADD THIS

const prisma = new PrismaClient();

// Supabase admin client — pass ws as transport for Node.js 20
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws   // ← ADD THIS
    }
  }
);

// ─── Login detailer ──────────────────────────────────────────────────────────
const loginDetailer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const detailer = await prisma.detailer.findFirst({
      where: {
        OR: [
          { supabaseUserId: authData.user.id },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (!detailer) {
      return res.status(401).json({
        success: false,
        message: 'Detailer account not found. Contact admin.'
      });
    }

    if (!detailer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact admin.'
      });
    }

    if (!detailer.supabaseUserId) {
      await prisma.detailer.update({
        where: { id: detailer.id },
        data: { supabaseUserId: authData.user.id }
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      detailer: {
        id: detailer.id,
        name: detailer.name,
        email: detailer.email,
        phone: detailer.phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// ─── Verify token ─────────────────────────────────────────────────────────────
const verifyDetailer = async (req, res) => {
  try {
    const detailer = await prisma.detailer.findFirst({
      where: {
        OR: [
          { supabaseUserId: req.detailer.sub },
          { email: req.detailer.email }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true
      }
    });

    if (!detailer || !detailer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account not found or disabled'
      });
    }

    res.json({ success: true, detailer });

  } catch (error) {
    console.error('Verify detailer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutDetailer = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// ─── Refresh token ────────────────────────────────────────────────────────────
const refreshDetailerToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
};

module.exports = {
  loginDetailer,
  verifyDetailer,
  logoutDetailer,
  refreshDetailerToken,
};
