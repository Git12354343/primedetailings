// backend/routes/photos.js
const express = require('express');
const { getPhotos, uploadPhoto, updatePhoto, deletePhoto, uploadMiddleware } = require('../controllers/photoController');

// Simple admin secret check for write operations
const requireAdmin = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const router = express.Router();

router.get('/',                                   getPhotos);   // public — Gallery page
router.post('/upload', requireAdmin, uploadMiddleware, uploadPhoto);
router.patch('/:id',   requireAdmin,               updatePhoto);
router.delete('/:id',  requireAdmin,               deletePhoto);

module.exports = router;
