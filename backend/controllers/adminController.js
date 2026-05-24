// backend/controllers/adminController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBookingData = (booking) => ({
  id: booking.id,
  confirmationCode: booking.confirmationCode,
  customer: {
    firstName:   booking.firstName   || 'Unknown',
    lastName:    booking.lastName    || '',
    phoneNumber: booking.phoneNumber || 'Unknown',
    email:       booking.email       || '',
    address:     booking.address     || 'Unknown',
    city:        booking.city        || '',
    postalCode:  booking.postalCode  || ''
  },
  vehicle: {
    type:  booking.vehicleType || 'Unknown',
    make:  booking.make        || 'Unknown',
    model: booking.model       || '',
    year:  booking.year        || null
  },
  services:            booking.services            || '[]',
  extras:              booking.extras              || '[]',
  date:                booking.date,
  time:                booking.time,
  status:              booking.status,
  detailerId:          booking.detailerId,
  detailer:            booking.detailer ? {
    id:    booking.detailer.id,
    name:  booking.detailer.name,
    email: booking.detailer.email
  } : null,
  specialInstructions: booking.specialInstructions,
  notes:               booking.notes,
  totalPrice:          booking.totalPrice,
  enRouteAt:           booking.enRouteAt,
  startedAt:           booking.startedAt,
  arrivedAt:           booking.arrivedAt,
  completedAt:         booking.completedAt,
  estimatedDuration:   booking.estimatedDuration,
  createdAt:           booking.createdAt,
  updatedAt:           booking.updatedAt
});

// ─── POST /api/admin/login ────────────────────────────────────────────────────
const adminLogin = (req, res) => {
  const { secret } = req.body;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
  res.json({ success: true, message: 'Login successful', token: process.env.ADMIN_SECRET });
};

// ─── Booking management ───────────────────────────────────────────────────────
const assignBookingToDetailer = async (req, res) => {
  try {
    const { bookingId, detailerId } = req.body;
    if (!bookingId || !detailerId) {
      return res.status(400).json({ success: false, message: 'Booking ID and Detailer ID are required' });
    }
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const detailer = await prisma.detailer.findUnique({ where: { id: parseInt(detailerId) } });
    if (!detailer) return res.status(404).json({ success: false, message: 'Detailer not found' });
    if (!detailer.isActive) return res.status(400).json({ success: false, message: 'Detailer is not active' });
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { detailerId: parseInt(detailerId), status: 'CONFIRMED', updatedAt: new Date() }
    });
    res.json({
      success: true,
      message: `Booking assigned to ${detailer.name} successfully`,
      booking: { id: updatedBooking.id, confirmationCode: updatedBooking.confirmationCode, detailerId: updatedBooking.detailerId, detailerName: detailer.name, status: updatedBooking.status }
    });
  } catch (error) {
    console.error('Assign booking error:', error);
    res.status(500).json({ success: false, message: 'Error assigning booking to detailer' });
  }
};

const getUnassignedBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { detailerId: null, status: { in: ['PENDING', 'CONFIRMED'] } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });
    res.json({ success: true, bookings: bookings.map(formatBookingData) });
  } catch (error) {
    console.error('Get unassigned bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching unassigned bookings' });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { detailer: { select: { id: true, name: true, email: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });
    res.json({ success: true, bookings: bookings.map(formatBookingData) });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching all bookings' });
  }
};

const getAssignedBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { detailerId: { not: null } },
      include: { detailer: { select: { id: true, name: true, email: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });
    res.json({ success: true, bookings: bookings.map(formatBookingData) });
  } catch (error) {
    console.error('Get assigned bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching assigned bookings' });
  }
};

const getActiveDetailers = async (req, res) => {
  try {
    const detailers = await prisma.detailer.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, email: true, phone: true,
        _count: { select: { bookings: { where: { status: { in: ['CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS'] } } } } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({
      success: true,
      detailers: detailers.map(d => ({ id: d.id, name: d.name, email: d.email, phone: d.phone, activeBookings: d._count.bookings }))
    });
  } catch (error) {
    console.error('Get active detailers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching active detailers' });
  }
};

const autoAssignBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID is required' });
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const detailers = await prisma.detailer.findMany({
      where: { isActive: true },
      include: { _count: { select: { bookings: { where: { status: { in: ['CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS'] } } } } } },
      orderBy: { bookings: { _count: 'asc' } }
    });
    if (detailers.length === 0) return res.status(400).json({ success: false, message: 'No active detailers available' });
    const selected = detailers[0];
    const updated = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { detailerId: selected.id, status: 'CONFIRMED', updatedAt: new Date() }
    });
    res.json({ success: true, message: `Booking auto-assigned to ${selected.name}`, booking: { id: updated.id, confirmationCode: updated.confirmationCode, detailerId: updated.detailerId, detailerName: selected.name, status: updated.status } });
  } catch (error) {
    console.error('Auto-assign booking error:', error);
    res.status(500).json({ success: false, message: 'Error auto-assigning booking' });
  }
};

// ─── Detailer account management ──────────────────────────────────────────────
const getAllDetailers = async (req, res) => {
  try {
    const detailers = await prisma.detailer.findMany({
      include: {
        _count: { select: { bookings: true } },
        bookings: { where: { status: { in: ['CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS'] } }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      detailers: detailers.map(d => ({
        id: d.id, name: d.name, email: d.email, phone: d.phone,
        isActive: d.isActive, supabaseUserId: d.supabaseUserId,
        createdAt: d.createdAt,
        totalBookings: d._count.bookings,
        activeBookings: d.bookings.length,
      })),
    });
  } catch (error) {
    console.error('getAllDetailers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch detailers' });
  }
};

const createDetailer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required' });
    }
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email: email.toLowerCase(), password, email_confirm: true });
    if (authError) return res.status(400).json({ success: false, message: authError.message });
    const detailer = await prisma.detailer.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), phone: phone.trim(), isActive: true, supabaseUserId: authData.user.id },
    });
    res.json({ success: true, message: 'Detailer account created', detailer: { id: detailer.id, name: detailer.name, email: detailer.email, isActive: detailer.isActive } });
  } catch (error) {
    console.error('createDetailer error:', error);
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Email or phone already exists' });
    res.status(500).json({ success: false, message: 'Failed to create detailer' });
  }
};

const updateDetailer = async (req, res) => {
  try {
    const { name, phone, isActive, password } = req.body;
    const id = parseInt(req.params.id);
    const data = {};
    if (name     !== undefined) data.name     = name.trim();
    if (phone    !== undefined) data.phone    = phone.trim();
    if (isActive !== undefined) data.isActive = isActive;
    const detailer = await prisma.detailer.update({ where: { id }, data });
    if (password && detailer.supabaseUserId) {
      const { createClient } = require('@supabase/supabase-js');
      const ws = require('ws');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });
      await supabaseAdmin.auth.admin.updateUserById(detailer.supabaseUserId, { password }).catch(e => console.error('Password update failed:', e.message));
    }
    res.json({ success: true, message: 'Detailer updated', detailer: { id: detailer.id, name: detailer.name, email: detailer.email, isActive: detailer.isActive } });
  } catch (error) {
    console.error('updateDetailer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update detailer' });
  }
};

const deleteDetailer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const detailer = await prisma.detailer.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: `${detailer.name} has been deactivated` });
  } catch (error) {
    console.error('deleteDetailer error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate detailer' });
  }
};

// ─── Revenue analytics ────────────────────────────────────────────────────────
const getRevenueAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const bookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED', totalPrice: { not: null }, date: { gte: eightWeeksAgo } },
      select: { date: true, totalPrice: true, vehicleType: true },
      orderBy: { date: 'asc' },
    });
    const getWeekKey = (d) => {
      const date = new Date(d);
      const day  = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };
    const weeklyMap = {};
    bookings.forEach(b => {
      const key = getWeekKey(b.date);
      if (!weeklyMap[key]) weeklyMap[key] = { weekStart: key, revenue: 0, jobs: 0 };
      weeklyMap[key].revenue += parseFloat(b.totalPrice || 0);
      weeklyMap[key].jobs    += 1;
    });
    const weekly = Object.values(weeklyMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart)).slice(-8).map(w => ({ ...w, revenue: Math.round(w.revenue * 100) / 100 }));
    const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue  = bookings.filter(b => new Date(b.date) >= monthStart).reduce((s, b) => s + parseFloat(b.totalPrice || 0), 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthBooks = await prisma.booking.findMany({ where: { status: 'COMPLETED', totalPrice: { not: null }, date: { gte: lastMonthStart, lte: lastMonthEnd } }, select: { totalPrice: true } });
    const lastMonthRev   = lastMonthBooks.reduce((s, b) => s + parseFloat(b.totalPrice || 0), 0);
    const avgTicket      = bookings.length ? bookings.reduce((s, b) => s + parseFloat(b.totalPrice || 0), 0) / bookings.length : 0;
    const byVehicle = {};
    bookings.forEach(b => { const v = b.vehicleType || 'Unknown'; byVehicle[v] = (byVehicle[v] || 0) + parseFloat(b.totalPrice || 0); });
    const topVehicles = Object.entries(byVehicle).map(([type, revenue]) => ({ type, revenue: Math.round(revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    res.json({ success: true, analytics: { weekly, monthRevenue: Math.round(monthRevenue * 100) / 100, lastMonthRev: Math.round(lastMonthRev * 100) / 100, monthChange: lastMonthRev > 0 ? Math.round(((monthRevenue - lastMonthRev) / lastMonthRev) * 100) : null, avgTicket: Math.round(avgTicket * 100) / 100, totalJobs: bookings.length, topVehicles } });
  } catch (error) {
    console.error('getRevenueAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching revenue analytics' });
  }
};

module.exports = {
  adminLogin,
  getAllDetailers,
  createDetailer,
  updateDetailer,
  deleteDetailer,
  getRevenueAnalytics,
  assignBookingToDetailer,
  getUnassignedBookings,
  getAllBookings,
  getAssignedBookings,
  getActiveDetailers,
  autoAssignBooking,
};
