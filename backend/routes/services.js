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

const router = express.Router();

// ========== SERVICE ROUTES ==========

// Public service routes (for booking form and website)
router.get('/active', getActiveServices);
router.post('/calculate-pricing', calculateDynamicPricing);

// Admin service routes (for admin panel)
router.get('/', getAllServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.delete('/:id/permanent', permanentDeleteService);

// ========== ADD-ON ROUTES ==========

// Public add-on routes (for booking form and website)
router.get('/addons/active', getActiveAddOns);
router.get('/addons/categories', getAddOnCategories);

// Admin add-on routes (for admin panel)
router.get('/addons', getAllAddOns);
router.post('/addons', createAddOn);
router.put('/addons/:id', updateAddOn);
router.delete('/addons/:id', deleteAddOn);
router.delete('/addons/:id/permanent', permanentDeleteAddOn);

// ========== UTILITY ROUTES ==========

// Get service categories
router.get('/categories', (req, res) => {
  const categories = ['DETAILING', 'PROTECTION', 'RESTORATION', 'MAINTENANCE', 'SPECIALTY'];
  res.json({
    success: true,
    categories: categories.map(category => ({
      value: category,
      label: category.charAt(0) + category.slice(1).toLowerCase()
    }))
  });
});

// Get vehicle types (for pricing reference)
router.get('/vehicle-types', (req, res) => {
  const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Coupe'];
  res.json({
    success: true,
    vehicleTypes
  });
});

// Health check for services API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Services API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      services: 'Available',
      addons: 'Available',
      pricing: 'Available'
    }
  });
});

module.exports = router;