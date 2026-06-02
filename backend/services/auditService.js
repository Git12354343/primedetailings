// backend/services/auditService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const audit = async (entityType, entityId, action, oldValue = null, newValue = null, ip = null, note = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId: String(entityId),
        action,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
        adminIp: ip || null,
        note: note || null,
      }
    });
  } catch (e) {
    console.error('[Audit] Log error:', e.message);
  }
};

const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

module.exports = { audit, getIp };
