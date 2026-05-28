// backend/middleware/requireAdmin.js

const requireAdmin = (req, res, next) => {
  const authHeader = req.header('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }

  next();
};

module.exports = requireAdmin;	
