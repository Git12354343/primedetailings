// backend/routes/reviews.js
// Reviews CRUD — same auth pattern as admin.js (X-Admin-Secret / Bearer token).
//  GET  /api/reviews/active  — PUBLIC. Active reviews ordered by sortOrder.
//  GET  /api/reviews          — ADMIN. All reviews.
//  POST /api/reviews          — ADMIN. Create.
//  PUT  /api/reviews/:id      — ADMIN. Update.
//  DELETE /api/reviews/:id    — ADMIN. Delete.

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Admin auth — mirrors the pattern in routes/admin.js ──────────────────────
const requireAdmin = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ── GET /api/reviews/active — PUBLIC ─────────────────────────────────────────
router.get('/active', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, reviews });
  } catch (err) {
    devError.error('GET /reviews/active error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// ── GET /api/reviews — ADMIN ──────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, reviews });
  } catch (err) {
    devError.error('GET /reviews error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// ── POST /api/reviews — ADMIN ─────────────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, rating, vehicle, text, source, isActive, sortOrder } = req.body;
    if (!name || !text) {
      return res.status(400).json({ success: false, error: 'name and text are required' });
    }
    const review = await prisma.review.create({
      data: {
        name:      String(name).trim(),
        rating:    Math.min(5, Math.max(1, parseInt(rating) || 5)),
        vehicle:   vehicle ? String(vehicle).trim() : null,
        text:      String(text).trim(),
        source:    source ? String(source).trim() : 'Google',
        isActive:  isActive !== false,
        sortOrder: parseInt(sortOrder) || 0,
      },
    });
    res.status(201).json({ success: true, review });
  } catch (err) {
    devError.error('POST /reviews error:', err);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
});

// ── PUT /api/reviews/:id — ADMIN ──────────────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    const { name, rating, vehicle, text, source, isActive, sortOrder } = req.body;
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(name      !== undefined && { name:      String(name).trim() }),
        ...(rating    !== undefined && { rating:    Math.min(5, Math.max(1, parseInt(rating))) }),
        ...(vehicle   !== undefined && { vehicle:   vehicle ? String(vehicle).trim() : null }),
        ...(text      !== undefined && { text:      String(text).trim() }),
        ...(source    !== undefined && { source:    String(source).trim() }),
        ...(isActive  !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) || 0 }),
      },
    });
    res.json({ success: true, review });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Review not found' });
    devError.error('PUT /reviews/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to update review' });
  }
});

// ── DELETE /api/reviews/:id — ADMIN ──────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid id' });
    await prisma.review.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Review not found' });
    devError.error('DELETE /reviews/:id error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
});

module.exports = router;
