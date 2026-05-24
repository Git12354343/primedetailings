const express = require('express');
const {
  getAllPackages,
  getActivePackages,
  createPackage,
  updatePackage,
  deletePackage,
  permanentDeletePackage,
} = require('../controllers/packageController');

const requireAdmin = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const router = express.Router();

// Public
router.get('/active', getActivePackages);

// Admin — protected
router.get('/',                 requireAdmin, getAllPackages);
router.post('/',                requireAdmin, createPackage);
router.put('/:id',              requireAdmin, updatePackage);
router.delete('/:id',           requireAdmin, deletePackage);
router.delete('/:id/permanent', requireAdmin, permanentDeletePackage);

module.exports = router;
