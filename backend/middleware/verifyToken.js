// backend/middleware/verifyToken.js
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');  // ← ADD THIS

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws   // ← ADD THIS
    }
  }
);

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    req.detailer = {
      sub: data.user.id,
      email: data.user.email,
      detailerId: data.user.id
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token validation failed.'
    });
  }
};

module.exports = verifyToken;
