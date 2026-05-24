// backend/middleware/verifyToken.js
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws   // ← ADD THIS
    }
  }
);

const prisma = new PrismaClient();

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

    // Look up the integer Prisma ID — critical for booking ownership checks
    const detailer = await prisma.detailer.findFirst({
      where: { supabaseUserId: data.user.id }
    });

    if (!detailer) {
      return res.status(401).json({ success: false, message: 'Detailer account not found.' });
    }

    if (!detailer.isActive) {
      return res.status(403).json({ success: false, message: 'Account disabled. Contact admin.' });
    }

    req.detailer = {
      sub:        data.user.id,
      email:      data.user.email,
      detailerId: detailer.id,   // integer — matches booking.detailerId
      name:       detailer.name,
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
