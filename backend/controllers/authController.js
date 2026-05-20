// backend/controllers/authController.js
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Supabase admin client (service role) — used ONLY on the server
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // Authenticate via Supabase Auth
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

    // Look up the detailer record linked to this Supabase user
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

    // Keep supabaseUserId in sync if it wasn't set yet
    if (!detailer.supabaseUserId) {
      await prisma.detailer.update({
        where: { id: detailer.id },
        data: { supabaseUserId: authData.user.id }
      });
    }

    // Return the Supabase session JWT — the frontend stores this
    res.json({
      success: true,
      message: 'Login successful',
      // access_token is a valid JWT signed by Supabase — used as Bearer token
      token: authData.session.access_token,
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

// ─── Verify token & return detailer info ────────────────────────────────────
const verifyDetailer = async (req, res) => {
  try {
    // req.detailer is populated by verifyToken middleware
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

// ─── Logout ──────────────────────────────────────────────────────────────────
const logoutDetailer = async (req, res) => {
  try {
    // Sign out the user from Supabase (invalidates the session server-side)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      // Set the session so Supabase knows which user to sign out
      await supabaseAdmin.auth.admin.signOut(token).catch(() => {});
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

module.exports = {
  loginDetailer,
  verifyDetailer,
  logoutDetailer
};