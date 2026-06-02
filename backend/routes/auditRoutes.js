// backend/routes/auditRoutes.js
const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.headers.authorization?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) return res.status(401).json({ success: false });
  next();
};

// GET /api/audit?entityType=&entityId=&action=&dateFrom=&dateTo=&page=&limit=
router.get('/', requireAdmin, async (req, res) => {
  const { entityType, entityId, action, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId)   where.entityId   = entityId;
  if (action)     where.action     = { contains: action };
  if (dateFrom || dateTo) where.createdAt = {};
  if (dateFrom) where.createdAt.gte = new Date(dateFrom);
  if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59');

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/audit/weather — latest weather alert from AppConfig
router.get('/weather', requireAdmin, async (req, res) => {
  try {
    const c = await prisma.appConfig.findUnique({ where: { key: 'weather_alert' } });
    res.json({ success: true, alert: c?.value || null });
  } catch { res.json({ success: true, alert: null }); }
});

module.exports = router;
