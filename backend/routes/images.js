// backend/routes/images.js
const express  = require('express');
const router   = express.Router();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken }  = require('../middleware/verifyToken');
const { requireAdmin } = require('../middleware/middleware');
const { cleanupExpiredImages } = require('../services/imageCleanupService');

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QUOTE_BUCKET = 'quote-uploads';
const JOB_BUCKET   = 'job-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_BOOKING = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

// ── CUSTOMER (public, rate-limited via server.js) ────────────────────────────

// POST /api/images/upload/quote
// Body: { fileName, mimeType, fileSize, fileBase64, bookingId? }
router.post('/upload/quote', async (req, res) => {
  try {
    const { fileName, mimeType, fileSize, fileBase64, bookingId } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType))
      return res.status(400).json({ success: false, error: 'Invalid file type. Use JPEG, PNG, or WebP.' });
    if (fileSize > MAX_FILE_SIZE)
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB per image.' });
    if (!fileBase64)
      return res.status(400).json({ success: false, error: 'No file data provided.' });

    // Check max files per booking
    if (bookingId) {
      const count = await prisma.bookingImage.count({
        where: { bookingId: parseInt(bookingId), isTemporary: true },
      });
      if (count >= MAX_FILES_PER_BOOKING)
        return res.status(400).json({ success: false, error: `Max ${MAX_FILES_PER_BOOKING} images per booking.` });
    }

    // Build storage path
    const timestamp = Date.now();
    const safeExt   = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const folder    = bookingId ? `booking-${bookingId}` : 'temp';
    const path      = `${folder}/${timestamp}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    // Decode base64 and upload
    const buffer = Buffer.from(fileBase64, 'base64');
    const { error: uploadError } = await supabase.storage
      .from(QUOTE_BUCKET)
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (uploadError)
      return res.status(500).json({ success: false, error: 'Upload failed: ' + uploadError.message });

    const { data: urlData } = supabase.storage.from(QUOTE_BUCKET).getPublicUrl(path);

    const image = await prisma.bookingImage.create({
      data: {
        bookingId: bookingId ? parseInt(bookingId) : null,
        storagePath: path,
        publicUrl: urlData.publicUrl,
        imageType: 'CUSTOMER_QUOTE',
        uploadedBy: 'customer',
        isTemporary: true,
        fileSize,
        mimeType,
      },
    });

    res.json({ success: true, image: { id: image.id, publicUrl: image.publicUrl } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/images/:id — customer deletes their own temp image
router.delete('/:id', async (req, res) => {
  try {
    const image = await prisma.bookingImage.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!image) return res.status(404).json({ success: false, error: 'Image not found' });
    if (!image.isTemporary) return res.status(403).json({ success: false, error: 'Cannot delete permanent image' });

    await supabase.storage.from(QUOTE_BUCKET).remove([image.storagePath]);
    await prisma.bookingImage.delete({ where: { id: image.id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DETAILER ──────────────────────────────────────────────────────────────────

// POST /api/images/upload/job
// Body: { fileName, mimeType, fileSize, fileBase64, bookingId, imageType }
router.post('/upload/job', verifyToken, async (req, res) => {
  try {
    const { fileName, mimeType, fileSize, fileBase64, bookingId, imageType, caption } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType))
      return res.status(400).json({ success: false, error: 'Invalid file type.' });
    if (fileSize > MAX_FILE_SIZE)
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB.' });
    if (!['BEFORE_JOB', 'AFTER_JOB', 'DAMAGE_REPORT'].includes(imageType))
      return res.status(400).json({ success: false, error: 'Invalid imageType for job upload.' });

    const timestamp = Date.now();
    const safeExt   = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const path      = `booking-${bookingId}/${imageType.toLowerCase()}-${timestamp}.${safeExt}`;

    const buffer = Buffer.from(fileBase64, 'base64');
    const { error: uploadError } = await supabase.storage
      .from(JOB_BUCKET)
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (uploadError)
      return res.status(500).json({ success: false, error: 'Upload failed: ' + uploadError.message });

    const { data: urlData } = supabase.storage.from(JOB_BUCKET).getPublicUrl(path);

    const image = await prisma.bookingImage.create({
      data: {
        bookingId: bookingId ? parseInt(bookingId) : null,
        storagePath: path,
        publicUrl: urlData.publicUrl,
        imageType,
        uploadedBy: req.detailer?.name || 'detailer',
        isTemporary: false,
        fileSize, mimeType, caption,
      },
    });

    res.json({ success: true, image: { id: image.id, publicUrl: image.publicUrl, imageType } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/images/admin — all images with filters
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { bookingId, imageType, isTemporary, isApproved } = req.query;
    const where = {};
    if (bookingId)   where.bookingId  = parseInt(bookingId);
    if (imageType)   where.imageType  = imageType;
    if (isTemporary !== undefined) where.isTemporary = isTemporary === 'true';
    if (isApproved  !== undefined) where.isApproved  = isApproved  === 'true';

    const images = await prisma.bookingImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/images/admin/:id/approve — approve for gallery
router.patch('/admin/:id/approve', requireAdmin, async (req, res) => {
  try {
    const image = await prisma.bookingImage.update({
      where: { id: parseInt(req.params.id) },
      data: { isApproved: req.body.isApproved, imageType: req.body.isApproved ? 'GALLERY' : undefined },
    });
    res.json({ success: true, image });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/images/admin/:id — permanent delete
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const image = await prisma.bookingImage.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!image) return res.status(404).json({ success: false, error: 'Not found' });

    const bucket = image.isTemporary ? QUOTE_BUCKET : JOB_BUCKET;
    await supabase.storage.from(bucket).remove([image.storagePath]);
    await prisma.bookingImage.delete({ where: { id: image.id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/images/admin/cleanup — manual trigger
router.post('/admin/cleanup', requireAdmin, async (req, res) => {
  try {
    const result = await cleanupExpiredImages();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
