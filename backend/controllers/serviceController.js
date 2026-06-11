// backend/controllers/serviceController.js
// Coupe removed — now only Sedan, SUV, Truck (display: "Truck / Large SUV")

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Canonical vehicle types ───────────────────────────────────────────────────
// "Truck" covers pickups AND large SUVs (Tahoe, Suburban, Escalade, etc.)
// Display label "Truck / Large SUV" is set on the frontend only — DB key stays "Truck"
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck'];

// ── Serializer ────────────────────────────────────────────────────────────────
const serializeService = (service) => ({
  id:                service.id,
  name:              service.name,
  nameFr:            service.nameFr           || null,
  description:       service.description      || null,
  descriptionFr:     service.descriptionFr    || null,
  includes:          service.includes         || null,
  includesFr:        service.includesFr       || null,
  pricingMode:       service.pricingMode      || 'FIXED',
  category:          service.category,
  isActive:          service.isActive,
  isFeatured:        service.isFeatured       ?? false,
  requiresQuote:     service.requiresQuote    ?? false,
  sortOrder:         service.sortOrder,
  estimatedDuration: service.estimatedDuration ?? null,
  promoPrice:        service.promoPrice       ? parseFloat(service.promoPrice) : null,
  updatedAt:         service.updatedAt,
  pricing: VEHICLE_TYPES.reduce((acc, vt) => {
    const p = service.pricing?.find(p => p.vehicleType === vt);
    acc[vt] = p ? parseFloat(p.price) : 0;
    return acc;
  }, {}),
});

// ── Public endpoints ──────────────────────────────────────────────────────────

const getActiveServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where:   { isActive: true },
      include: { pricing: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, services: services.map(serializeService) });
  } catch (err) {
    console.error('getActiveServices error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

const getActiveAddOns = async (req, res) => {
  try {
    const addOns = await prisma.addOn.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({
      success: true,
      addOns: addOns.map(a => ({
        id:            a.id,
        name:          a.name,
        nameFr:        a.nameFr        || null,
        description:   a.description   || null,
        descriptionFr: a.descriptionFr || null,
        category:      a.category,
        price:         parseFloat(a.price),
        requiresQuote: a.requiresQuote ?? false,
        sortOrder:     a.sortOrder,
      })),
    });
  } catch (err) {
    console.error('getActiveAddOns error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch add-ons' });
  }
};

const calculatePricing = async (req, res) => {
  try {
    const { services: serviceIds, addOns: addOnIds, vehicleType } = req.body;

    if (!vehicleType || !VEHICLE_TYPES.includes(vehicleType))
      return res.status(400).json({ success: false, message: `Invalid vehicle type. Must be one of: ${VEHICLE_TYPES.join(', ')}` });

    const pricing = { services: [], addOns: [], subtotal: 0, total: 0 };

    if (serviceIds?.length) {
      const rows = await prisma.service.findMany({
        where:   { id: { in: serviceIds.map(Number) }, isActive: true },
        include: { pricing: { where: { vehicleType } } },
      });
      for (const svc of rows) {
        const price = svc.pricing[0] ? parseFloat(svc.pricing[0].price) : 0;
        pricing.services.push({ id: svc.id, name: svc.name, price });
        pricing.subtotal += price;
      }
    }

    if (addOnIds?.length) {
      const rows = await prisma.addOn.findMany({
        where: { id: { in: addOnIds.map(Number) }, isActive: true },
      });
      for (const addon of rows) {
        const price = parseFloat(addon.price);
        pricing.addOns.push({ id: addon.id, name: addon.name, price });
        pricing.subtotal += price;
      }
    }

    pricing.total = pricing.subtotal;
    res.json({ success: true, pricing });
  } catch (err) {
    console.error('calculatePricing error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate pricing' });
  }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({ include: { pricing: true }, orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, services: services.map(serializeService) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createService = async (req, res) => {
  try {
    const { name, nameFr, description, descriptionFr, includes, includesFr, category,
            pricingMode, isActive, isFeatured, requiresQuote, sortOrder,
            estimatedDuration, promoPrice, pricing } = req.body;
    const service = await prisma.service.create({
      data: {
        name, nameFr, description, descriptionFr, includes, includesFr,
        category: category || 'DETAILING', pricingMode: pricingMode || 'FIXED',
        isActive: isActive ?? true, isFeatured: isFeatured ?? false,
        requiresQuote: requiresQuote ?? false, sortOrder: sortOrder ?? 0,
        estimatedDuration: estimatedDuration || null, promoPrice: promoPrice || null,
        pricing: pricing ? {
          create: VEHICLE_TYPES.map(vt => ({ vehicleType: vt, price: pricing[vt] || 0 })),
        } : undefined,
      },
      include: { pricing: true },
    });
    res.status(201).json({ success: true, service: serializeService(service) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateService = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { pricing, ...data } = req.body;
    await prisma.service.update({ where: { id }, data });
    if (pricing) {
      for (const vt of VEHICLE_TYPES) {
        if (pricing[vt] !== undefined) {
          await prisma.servicePricing.upsert({
            where:  { serviceId_vehicleType: { serviceId: id, vehicleType: vt } },
            update: { price: pricing[vt] },
            create: { serviceId: id, vehicleType: vt, price: pricing[vt] },
          });
        }
      }
    }
    const updated = await prisma.service.findUnique({ where: { id }, include: { pricing: true } });
    res.json({ success: true, service: serializeService(updated) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteService = async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getAllAddOns = async (req, res) => {
  try {
    const addOns = await prisma.addOn.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, addOns: addOns.map(a => ({
      id: a.id, name: a.name, nameFr: a.nameFr, description: a.description,
      descriptionFr: a.descriptionFr, category: a.category,
      price: parseFloat(a.price), requiresQuote: a.requiresQuote,
      isActive: a.isActive, sortOrder: a.sortOrder,
    }))});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createAddOn = async (req, res) => {
  try {
    const addOn = await prisma.addOn.create({ data: req.body });
    res.status(201).json({ success: true, addOn });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateAddOn = async (req, res) => {
  try {
    const addOn = await prisma.addOn.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json({ success: true, addOn });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteAddOn = async (req, res) => {
  try {
    await prisma.addOn.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = {
  calculateDynamicPricing: calculatePricing,
  permanentDeleteService:  deleteService,
  VEHICLE_TYPES,
  getActiveServices, getActiveAddOns, calculatePricing,
  getAllServices, createService, updateService, deleteService,
  getAllAddOns, createAddOn, updateAddOn, deleteAddOn,
};
