const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe'];

// ── Serializer ────────────────────────────────────────────────────────────────
const serializeService = (service) => ({
  id:                service.id,
  name:              service.name,
  description:       service.description,
  category:          service.category,
  isActive:          service.isActive,
  isFeatured:        service.isFeatured   ?? false,
  sortOrder:         service.sortOrder,
  estimatedDuration: service.estimatedDuration ?? null,
  promoPrice:        service.promoPrice ? parseFloat(service.promoPrice) : null,
  pricing:           (service.pricing || []).reduce((acc, p) => {
    acc[p.vehicleType] = parseFloat(p.price);
    return acc;
  }, {}),
  createdAt:  service.createdAt,
  updatedAt:  service.updatedAt,
});

// ── GET /api/services ─────────────────────────────────────────────────────────
const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: { pricing: { orderBy: { vehicleType: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, services: services.map(serializeService) });
  } catch (error) {
    console.error('getAllServices error:', error);
    res.status(500).json({ success: false, message: 'Error fetching services' });
  }
};

// ── GET /api/services/active ──────────────────────────────────────────────────
const getActiveServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: { pricing: { orderBy: { vehicleType: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, services: services.map(serializeService) });
  } catch (error) {
    console.error('getActiveServices error:', error);
    res.status(500).json({ success: false, message: 'Error fetching active services' });
  }
};

// ── POST /api/services ────────────────────────────────────────────────────────
const createService = async (req, res) => {
  try {
    const { name, description, category, pricing, sortOrder, isFeatured, estimatedDuration, promoPrice } = req.body;

    if (!name || !pricing) {
      return res.status(400).json({ success: false, message: 'Name and pricing are required' });
    }

    const missing = VEHICLE_TYPES.filter(t => !pricing[t] || pricing[t] <= 0);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing pricing for: ${missing.join(', ')}` });
    }

    const service = await prisma.service.create({
      data: {
        name:              name.trim(),
        description:       description?.trim() || null,
        category:          category || 'DETAILING',
        sortOrder:         sortOrder || 0,
        isFeatured:        isFeatured ?? false,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        promoPrice:        promoPrice ? parseFloat(promoPrice) : null,
        pricing: {
          create: VEHICLE_TYPES.map(vehicleType => ({
            vehicleType,
            price: parseFloat(pricing[vehicleType]),
          })),
        },
      },
      include: { pricing: true },
    });

    res.status(201).json({ success: true, message: 'Service created', service: serializeService(service) });
  } catch (error) {
    console.error('createService error:', error);
    if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Service name already exists' });
    res.status(500).json({ success: false, message: 'Error creating service' });
  }
};

// ── PUT /api/services/:id ─────────────────────────────────────────────────────
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, pricing, isActive, isFeatured, sortOrder, estimatedDuration, promoPrice } = req.body;

    const existing = await prisma.service.findUnique({ where: { id: parseInt(id) }, include: { pricing: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Service not found' });

    if (pricing) {
      const missing = VEHICLE_TYPES.filter(t => !pricing[t] || pricing[t] <= 0);
      if (missing.length) return res.status(400).json({ success: false, message: `Missing pricing for: ${missing.join(', ')}` });
    }

    const updateData = {};
    if (name              !== undefined) updateData.name              = name.trim();
    if (description       !== undefined) updateData.description       = description?.trim() || null;
    if (category          !== undefined) updateData.category          = category;
    if (isActive          !== undefined) updateData.isActive          = isActive;
    if (isFeatured        !== undefined) updateData.isFeatured        = isFeatured;
    if (sortOrder         !== undefined) updateData.sortOrder         = parseInt(sortOrder) || 0;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration ? parseInt(estimatedDuration) : null;
    if (promoPrice        !== undefined) updateData.promoPrice        = promoPrice ? parseFloat(promoPrice) : null;

    let updatedService = await prisma.service.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { pricing: true },
    });

    if (pricing) {
      await prisma.servicePricing.deleteMany({ where: { serviceId: parseInt(id) } });
      await prisma.servicePricing.createMany({
        data: VEHICLE_TYPES.map(vehicleType => ({
          serviceId: parseInt(id),
          vehicleType,
          price: parseFloat(pricing[vehicleType]),
        })),
      });
      updatedService = await prisma.service.findUnique({ where: { id: parseInt(id) }, include: { pricing: true } });
    }

    res.json({ success: true, message: 'Service updated', service: serializeService(updatedService) });
  } catch (error) {
    console.error('updateService error:', error);
    res.status(500).json({ success: false, message: 'Error updating service' });
  }
};

// ── DELETE /api/services/:id (soft) ──────────────────────────────────────────
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    await prisma.service.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    res.json({ success: true, message: 'Service deactivated' });
  } catch (error) {
    console.error('deleteService error:', error);
    res.status(500).json({ success: false, message: 'Error deactivating service' });
  }
};

// ── DELETE /api/services/:id/permanent ───────────────────────────────────────
const permanentDeleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    await prisma.servicePricing.deleteMany({ where: { serviceId: parseInt(id) } });
    await prisma.service.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Service permanently deleted' });
  } catch (error) {
    console.error('permanentDeleteService error:', error);
    res.status(500).json({ success: false, message: 'Error deleting service' });
  }
};

// ── Add-ons ───────────────────────────────────────────────────────────────────
const serializeAddOn = (a) => ({
  id: a.id, name: a.name, description: a.description,
  category: a.category, price: parseFloat(a.price),
  isActive: a.isActive, sortOrder: a.sortOrder,
  createdAt: a.createdAt, updatedAt: a.updatedAt,
});

const getAllAddOns = async (req, res) => {
  try {
    const addOns = await prisma.addOn.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.json({ success: true, addOns: addOns.map(serializeAddOn) });
  } catch (error) {
    console.error('getAllAddOns error:', error);
    res.status(500).json({ success: false, message: 'Error fetching add-ons' });
  }
};

const getActiveAddOns = async (req, res) => {
  try {
    const addOns = await prisma.addOn.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.json({ success: true, addOns: addOns.map(serializeAddOn) });
  } catch (error) {
    console.error('getActiveAddOns error:', error);
    res.status(500).json({ success: false, message: 'Error fetching active add-ons' });
  }
};

const createAddOn = async (req, res) => {
  try {
    const { name, description, category, price, sortOrder } = req.body;
    if (!name || !price || price <= 0) return res.status(400).json({ success: false, message: 'Name and valid price required' });
    const addOn = await prisma.addOn.create({
      data: { name: name.trim(), description: description?.trim() || null, category: category || 'ENHANCEMENT', price: parseFloat(price), sortOrder: sortOrder || 0 },
    });
    res.status(201).json({ success: true, message: 'Add-on created', addOn: serializeAddOn(addOn) });
  } catch (error) {
    console.error('createAddOn error:', error);
    res.status(500).json({ success: false, message: 'Error creating add-on' });
  }
};

const updateAddOn = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, isActive, sortOrder } = req.body;
    const existing = await prisma.addOn.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Add-on not found' });

    const data = {};
    if (name        !== undefined) data.name        = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (category    !== undefined) data.category    = category;
    if (price       !== undefined) {
      if (price <= 0) return res.status(400).json({ success: false, message: 'Price must be > 0' });
      data.price = parseFloat(price);
    }
    if (isActive    !== undefined) data.isActive  = isActive;
    if (sortOrder   !== undefined) data.sortOrder = parseInt(sortOrder) || 0;

    const updated = await prisma.addOn.update({ where: { id: parseInt(id) }, data });
    res.json({ success: true, message: 'Add-on updated', addOn: serializeAddOn(updated) });
  } catch (error) {
    console.error('updateAddOn error:', error);
    res.status(500).json({ success: false, message: 'Error updating add-on' });
  }
};

const deleteAddOn = async (req, res) => {
  try {
    const { id } = req.params;
    const addOn = await prisma.addOn.findUnique({ where: { id: parseInt(id) } });
    if (!addOn) return res.status(404).json({ success: false, message: 'Add-on not found' });
    await prisma.addOn.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    res.json({ success: true, message: 'Add-on deactivated' });
  } catch (error) {
    console.error('deleteAddOn error:', error);
    res.status(500).json({ success: false, message: 'Error deactivating add-on' });
  }
};

// ── Pricing calculator ────────────────────────────────────────────────────────
const calculateDynamicPricing = async (req, res) => {
  try {
    const { services, addOns, vehicleType } = req.body;
    if (!vehicleType || !VEHICLE_TYPES.includes(vehicleType)) {
      return res.status(400).json({ success: false, message: 'Valid vehicle type required' });
    }

    let total = 0;
    const breakdown = { services: [], addOns: [], subtotal: 0, total: 0 };

    if (services?.length) {
      const records = await prisma.service.findMany({
        where: { id: { in: services.map(id => parseInt(id)) }, isActive: true },
        include: { pricing: { where: { vehicleType } } },
      });
      records.forEach(svc => {
        const p = svc.pricing[0];
        if (p) {
          // Use promoPrice if set
          const price = svc.promoPrice ? parseFloat(svc.promoPrice) : parseFloat(p.price);
          total += price;
          breakdown.services.push({ id: svc.id, name: svc.name, price });
        }
      });
    }

    if (addOns?.length) {
      const records = await prisma.addOn.findMany({
        where: { id: { in: addOns.map(id => parseInt(id)) }, isActive: true },
      });
      records.forEach(a => {
        const price = parseFloat(a.price);
        total += price;
        breakdown.addOns.push({ id: a.id, name: a.name, price });
      });
    }

    breakdown.subtotal = total;
    breakdown.total    = total;
    res.json({ success: true, pricing: breakdown });
  } catch (error) {
    console.error('calculateDynamicPricing error:', error);
    res.status(500).json({ success: false, message: 'Error calculating pricing' });
  }
};

module.exports = {
  getAllServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,
  permanentDeleteService,
  getAllAddOns,
  getActiveAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  calculateDynamicPricing,
};
