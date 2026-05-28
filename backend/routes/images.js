// backend/routes/checklists.js
const express  = require('express');
const router   = express.Router();

// ── requireAdmin (inline — matches existing pattern in admin.js) ──────────────
const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.headers.authorization?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};
const { PrismaClient } = require('@prisma/client');
const verifyToken = require('../middleware/verifyToken');

const prisma = new PrismaClient();

// Helper — detect if booking needs ceramic template
function detectTemplateType(booking) {
  const services = booking.services?.toLowerCase() || '';
  if (services.includes('ceramic') || services.includes('céramique')) return 'CERAMIC_COATING';
  if (services.includes('interior') || services.includes('intérieur')) return 'INTERIOR_ONLY';
  return 'STANDARD';
}

// ── DETAILER ─────────────────────────────────────────────────────────────────

// POST /api/checklists/booking/:bookingId/init — create checklist from template
router.post('/booking/:bookingId/init', verifyToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);

    // Already exists?
    const existing = await prisma.jobChecklist.findUnique({ where: { bookingId } });
    if (existing) return res.json({ success: true, message: 'Already exists', checklistId: existing.id });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const type = detectTemplateType(booking);
    const template = await prisma.checklistTemplate.findFirst({
      where: { serviceType: type, isDefault: true, isActive: true },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!template) return res.status(404).json({ success: false, error: 'No checklist template found' });

    const checklist = await prisma.jobChecklist.create({
      data: {
        bookingId,
        templateId: template.id,
        items: {
          create: template.items.map(item => ({
            label:        item.label,
            labelFr:      item.labelFr,
            isRequired:   item.isRequired,
            requiresPhoto:item.requiresPhoto,
            sortOrder:    item.sortOrder,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    res.json({ success: true, checklist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checklists/booking/:bookingId — get checklist
router.get('/booking/:bookingId', verifyToken, async (req, res) => {
  try {
    const checklist = await prisma.jobChecklist.findUnique({
      where: { bookingId: parseInt(req.params.bookingId) },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!checklist) return res.status(404).json({ success: false, error: 'No checklist found. Call /init first.' });
    res.json({ success: true, checklist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/checklists/booking/:bookingId/ready — can job be marked complete?
router.get('/booking/:bookingId/ready', verifyToken, async (req, res) => {
  try {
    const checklist = await prisma.jobChecklist.findUnique({
      where: { bookingId: parseInt(req.params.bookingId) },
      include: { items: true },
    });

    if (!checklist) return res.json({ canComplete: true, missing: [] }); // no checklist = no block

    const missing = checklist.items.filter(i => i.isRequired && !i.isCompleted);
    res.json({
      canComplete: missing.length === 0,
      missing: missing.map(i => ({ id: i.id, label: i.label, requiresPhoto: i.requiresPhoto })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/checklists/item/:itemId/complete — check off item
router.patch('/item/:itemId/complete', verifyToken, async (req, res) => {
  try {
    const { notes, photoUrl } = req.body;
    const item = await prisma.jobChecklistItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        completedBy: req.detailer?.name || 'detailer',
        notes: notes || null,
        photoUrl: photoUrl || null,
      },
    });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/checklists/item/:itemId/uncomplete — uncheck item
router.patch('/item/:itemId/uncomplete', verifyToken, async (req, res) => {
  try {
    const item = await prisma.jobChecklistItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: { isCompleted: false, completedAt: null, completedBy: null },
    });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/checklists/admin/templates
router.get('/admin/templates', requireAdmin, async (req, res) => {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { serviceType: 'asc' },
    });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/checklists/admin/templates
router.post('/admin/templates', requireAdmin, async (req, res) => {
  try {
    const { name, nameFr, serviceType, items } = req.body;
    const template = await prisma.checklistTemplate.create({
      data: {
        name, nameFr,
        serviceType: serviceType || 'STANDARD',
        items: items?.length ? {
          create: items.map((item, i) => ({ ...item, sortOrder: item.sortOrder ?? i })),
        } : undefined,
      },
      include: { items: true },
    });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/checklists/admin/templates/:id
router.put('/admin/templates/:id', requireAdmin, async (req, res) => {
  try {
    const { name, nameFr, serviceType, isActive } = req.body;
    const template = await prisma.checklistTemplate.update({
      where: { id: parseInt(req.params.id) },
      data: { name, nameFr, serviceType, isActive },
    });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
