const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe'];

const serialize = (pkg) => ({
  id:                pkg.id,
  name:              pkg.name,
  description:       pkg.description,
  tagline:           pkg.tagline,
  imageUrl:          pkg.imageUrl,
  includedServices:  Array.isArray(pkg.includedServices) ? pkg.includedServices : [],
  includedAddOns:    Array.isArray(pkg.includedAddOns)   ? pkg.includedAddOns   : [],
  pricing:           pkg.pricing && typeof pkg.pricing === 'object' ? pkg.pricing : {},
  estimatedDuration: pkg.estimatedDuration,
  isActive:          pkg.isActive,
  isFeatured:        pkg.isFeatured,
  isMostPopular:     pkg.isMostPopular,
  requiresQuote:     pkg.requiresQuote,
  sortOrder:         pkg.sortOrder,
  createdAt:         pkg.createdAt,
  updatedAt:         pkg.updatedAt,
});

// GET /api/packages
const getAllPackages = async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, packages: packages.map(serialize) });
  } catch (error) {
    console.error('getAllPackages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching packages' });
  }
};

// GET /api/packages/active
const getActivePackages = async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where:   { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, packages: packages.map(serialize) });
  } catch (error) {
    console.error('getActivePackages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching active packages' });
  }
};

// POST /api/packages
const createPackage = async (req, res) => {
  try {
    const {
      name, description, tagline, imageUrl,
      includedServices, includedAddOns, pricing,
      estimatedDuration, isActive, isFeatured,
      isMostPopular, requiresQuote, sortOrder,
    } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const pkg = await prisma.package.create({
      data: {
        name:              name.trim(),
        description:       description?.trim()  || null,
        tagline:           tagline?.trim()       || null,
        imageUrl:          imageUrl?.trim()      || null,
        includedServices:  Array.isArray(includedServices) ? includedServices : [],
        includedAddOns:    Array.isArray(includedAddOns)   ? includedAddOns   : [],
        pricing:           pricing && typeof pricing === 'object' ? pricing : {},
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        isActive:          isActive     ?? true,
        isFeatured:        isFeatured   ?? false,
        isMostPopular:     isMostPopular ?? false,
        requiresQuote:     requiresQuote ?? false,
        sortOrder:         parseInt(sortOrder) || 0,
      },
    });
    res.status(201).json({ success: true, message: 'Package created', package: serialize(pkg) });
  } catch (error) {
    console.error('createPackage error:', error);
    res.status(500).json({ success: false, message: 'Error creating package' });
  }
};

// PUT /api/packages/:id
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.package.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Package not found' });

    const {
      name, description, tagline, imageUrl,
      includedServices, includedAddOns, pricing,
      estimatedDuration, isActive, isFeatured,
      isMostPopular, requiresQuote, sortOrder,
    } = req.body;

    const data = {};
    if (name              !== undefined) data.name              = name.trim();
    if (description       !== undefined) data.description       = description?.trim() || null;
    if (tagline           !== undefined) data.tagline           = tagline?.trim()      || null;
    if (imageUrl          !== undefined) data.imageUrl          = imageUrl?.trim()     || null;
    if (includedServices  !== undefined) data.includedServices  = Array.isArray(includedServices) ? includedServices : [];
    if (includedAddOns    !== undefined) data.includedAddOns    = Array.isArray(includedAddOns)   ? includedAddOns   : [];
    if (pricing           !== undefined) data.pricing           = pricing && typeof pricing === 'object' ? pricing : {};
    if (estimatedDuration !== undefined) data.estimatedDuration = estimatedDuration ? parseInt(estimatedDuration) : null;
    if (isActive          !== undefined) data.isActive          = isActive;
    if (isFeatured        !== undefined) data.isFeatured        = isFeatured;
    if (isMostPopular     !== undefined) data.isMostPopular     = isMostPopular;
    if (requiresQuote     !== undefined) data.requiresQuote     = requiresQuote;
    if (sortOrder         !== undefined) data.sortOrder         = parseInt(sortOrder) || 0;

    const updated = await prisma.package.update({ where: { id: parseInt(id) }, data });
    res.json({ success: true, message: 'Package updated', package: serialize(updated) });
  } catch (error) {
    console.error('updatePackage error:', error);
    res.status(500).json({ success: false, message: 'Error updating package' });
  }
};

// DELETE /api/packages/:id
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.package.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Package not found' });
    await prisma.package.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    res.json({ success: true, message: 'Package deactivated' });
  } catch (error) {
    console.error('deletePackage error:', error);
    res.status(500).json({ success: false, message: 'Error deleting package' });
  }
};

// DELETE /api/packages/:id/permanent
const permanentDeletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.package.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Package permanently deleted' });
  } catch (error) {
    console.error('permanentDeletePackage error:', error);
    res.status(500).json({ success: false, message: 'Error deleting package' });
  }
};

module.exports = {
  getAllPackages,
  getActivePackages,
  createPackage,
  updatePackage,
  deletePackage,
  permanentDeletePackage,
};
