// backend/routes/export.js — CSV export for bookings, quotes, customers
const express = require('express');
const router  = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.headers.authorization?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) return res.status(401).json({ success: false });
  next();
};

const esc = (v) => {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
};
const row  = (arr) => arr.map(esc).join(',');
const send = (res, filename, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.write('\uFEFF'); // UTF-8 BOM for Excel
  rows.forEach(r => res.write(row(r) + '\r\n'));
  res.end();
};
const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

// GET /api/export/bookings
router.get('/bookings', requireAdmin, async (req, res) => {
  const { dateFrom, dateTo, status } = req.query;
  const where = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) where.date = {};
  if (dateFrom) where.date.gte = new Date(dateFrom);
  if (dateTo)   where.date.lte = new Date(dateTo + 'T23:59:59');

  const bookings = await prisma.booking.findMany({
    where, orderBy: { date: 'desc' }, take: 10000,
    include: { package: { select: { name: true } } },
  });

  const headers = ['Code','Status','Date','Time','FirstName','LastName','Phone','Email','Address','City','PostalCode','Vehicle','Condition','Package','Price','ServiceAddress','CreatedAt'];
  const rows = bookings.map(b => [
    b.confirmationCode, b.status, fmtDate(b.date), b.time,
    b.firstName, b.lastName, b.phoneNumber, b.email,
    b.address, b.city, b.postalCode,
    b.vehicleType, b.vehicleCondition,
    b.package?.name || '',
    b.totalPrice ? Number(b.totalPrice).toFixed(2) : '',
    b.address,
    fmtDate(b.createdAt),
  ]);
  send(res, `bookings-${fmtDate(new Date())}.csv`, [headers, ...rows]);
});

// GET /api/export/quotes
router.get('/quotes', requireAdmin, async (req, res) => {
  const { dateFrom, dateTo, status } = req.query;
  const where = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) where.createdAt = {};
  if (dateFrom) where.createdAt.gte = new Date(dateFrom);
  if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59');

  const quotes = await prisma.quote.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });
  const headers = ['Ref','Status','Name','Phone','Email','City','Vehicle','Condition','Package','QuotedPrice','CreatedAt'];
  const rows = quotes.map(q => [
    q.referenceId, q.status, q.customerName, q.phoneNumber, q.email || '',
    q.city, q.vehicleType, q.vehicleCondition, q.packageName || '',
    q.quotedPrice ? Number(q.quotedPrice).toFixed(2) : '',
    fmtDate(q.createdAt),
  ]);
  send(res, `quotes-${fmtDate(new Date())}.csv`, [headers, ...rows]);
});

// GET /api/export/customers — unique phone numbers from bookings
router.get('/customers', requireAdmin, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    select: { firstName:true, lastName:true, phoneNumber:true, email:true, city:true, createdAt:true },
    orderBy: { createdAt: 'desc' }, take: 20000,
  });
  // Dedupe by phoneNumber
  const seen = new Set(); const unique = [];
  for (const b of bookings) {
    if (!seen.has(b.phoneNumber)) { seen.add(b.phoneNumber); unique.push(b); }
  }
  const headers = ['FirstName','LastName','Phone','Email','City','FirstBooking'];
  const rows = unique.map(b => [b.firstName, b.lastName, b.phoneNumber, b.email, b.city, fmtDate(b.createdAt)]);
  send(res, `customers-${fmtDate(new Date())}.csv`, [headers, ...rows]);
});

module.exports = router;
