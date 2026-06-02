// backend/routes/services.js - Complete with Add-on Management
const express = require('express');
const {
  getAllServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,
  permanentDeleteService,
  calculateDynamicPricing
} = require('../controllers/serviceController');

const {
  getAllAddOns,
  getActiveAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  permanentDeleteAddOn,
  getAddOnCategories
} = require('../controllers/addOnController');

// ── Admin auth — same pattern as admin.js and packages.js ───────────────────
const requireAdmin = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const router = express.Router();

// ========== SERVICE ROUTES ==========

// Public (no auth required)
router.get('/active',            getActiveServices);
router.post('/calculate-pricing',calculateDynamicPricing);
router.get('/categories',        (req, res) => res.json({ success: true, categories: ['DETAILING','PROTECTION','RESTORATION','MAINTENANCE','SPECIALTY'].map(c => ({ value: c, label: c[0]+c.slice(1).toLowerCase() })) }));
router.get('/vehicle-types',     (req, res) => res.json({ success: true, vehicleTypes: ['Sedan','SUV','Truck','Coupe'] }));
router.get('/health',            (req, res) => res.json({ success: true, message: 'Services API is healthy' }));

// Admin — protected
router.get('/',                   requireAdmin, getAllServices);
router.post('/',                  requireAdmin, createService);
router.put('/:id',                requireAdmin, updateService);
router.delete('/:id',             requireAdmin, deleteService);
router.delete('/:id/permanent',   requireAdmin, permanentDeleteService);

// ========== ADD-ON ROUTES ==========

// Public (no auth required)
router.get('/addons/active',     getActiveAddOns);
router.get('/addons/categories', getAddOnCategories);

// Admin — protected
router.get('/addons',                  requireAdmin, getAllAddOns);
router.post('/addons',                 requireAdmin, createAddOn);
router.put('/addons/:id',              requireAdmin, updateAddOn);
router.delete('/addons/:id',           requireAdmin, deleteAddOn);
router.delete('/addons/:id/permanent', requireAdmin, permanentDeleteAddOn);

module.exports = router;