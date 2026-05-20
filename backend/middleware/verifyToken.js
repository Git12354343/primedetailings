// backend/middleware/verifyToken.js
// Verifies Supabase-issued JWTs (same interface as before — just updated validation)
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
    // Validate the token against Supabase Auth — returns the user payload
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    // Populate req.detailer with the Supabase user payload
    // Fields: sub (user id), email — same shape downstream controllers expect
    req.detailer = {
      sub: data.user.id,           // Supabase UUID
      email: data.user.email,
      detailerId: data.user.id     // alias for any controller using detailerId
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