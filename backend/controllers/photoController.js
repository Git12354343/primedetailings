// backend/controllers/photoController.js
// Uses multer memory storage → streams raw bytes to Supabase Storage
// No base64, no JSON size limits, no RAM buffering of large files.

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const ws = require('ws');

const prisma = new PrismaClient();

// Multer — memory storage (buffer passed straight to Supabase, never touches disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB raw file is fine — NOT JSON
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/i;
    if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// Export multer middleware so the route can apply it
const uploadMiddleware = upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage',  maxCount: 1 },
]);

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
);

// Upload a buffer to Supabase Storage, return the public URL
const uploadToSupabase = async (supabase, buffer, mimetype, suffix) => {
  const ext = mimetype.includes('png') ? 'png' : mimetype.includes('webp') ? 'webp' : 'jpg';
  const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}_${suffix}.${ext}`;

  const { error } = await supabase.storage
    .from('job-photos')
    .upload(filePath, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from('job-photos').getPublicUrl(filePath);
  return { url: data.publicUrl, filePath };
};

// ── GET /api/photos ───────────────────────────────────────────────────────────
const getPhotos = async (req, res) => {
  try {
    if (!prisma.jobPhoto) {
      return res.json({ success: true, photos: [], _notice: 'Run: npx prisma migrate dev' });
    }
    const { category, featured, limit = 50 } = req.query;
    const where = {};
    if (category) where.serviceType = category;
    if (featured === 'true') where.featured = true;

    const photos = await prisma.jobPhoto.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: parseInt(limit),
    });
    res.json({ success: true, photos });
  } catch (error) {
    console.error('getPhotos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch photos' });
  }
};

// ── POST /api/photos/upload  (multipart/form-data) ────────────────────────────
const uploadPhoto = async (req, res) => {
  try {
    if (!prisma.jobPhoto) {
      return res.status(503).json({ success: false, message: 'Run prisma migrate first' });
    }

    const { vehicle, serviceType, caption, bookingId, uploadedBy } = req.body;
    const files = req.files || {};

    if (!files.beforeImage?.[0]) {
      return res.status(400).json({ success: false, message: 'Before image is required' });
    }

    const supabase = getSupabase();

    const beforeFile = files.beforeImage[0];
    const { url: beforeUrl } = await uploadToSupabase(supabase, beforeFile.buffer, beforeFile.mimetype, 'before');

    let afterUrl = null;
    if (files.afterImage?.[0]) {
      const afterFile = files.afterImage[0];
      const result = await uploadToSupabase(supabase, afterFile.buffer, afterFile.mimetype, 'after');
      afterUrl = result.url;
    }

    const photo = await prisma.jobPhoto.create({
      data: {
        beforeUrl,
        afterUrl,
        vehicle:     vehicle     || 'Unknown',
        serviceType: serviceType || 'Detailing',
        caption:     caption     || null,
        bookingId:   bookingId   ? parseInt(bookingId) : null,
        uploadedBy:  uploadedBy  || null,
      },
    });

    res.json({ success: true, photo });
  } catch (error) {
    console.error('uploadPhoto error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/photos/:id ─────────────────────────────────────────────────────
const updatePhoto = async (req, res) => {
  try {
    if (!prisma.jobPhoto) return res.status(503).json({ success: false, message: 'Migration pending' });
    const { featured, caption } = req.body;
    const data = {};
    if (featured !== undefined) data.featured = featured;
    if (caption  !== undefined) data.caption  = caption;
    const photo = await prisma.jobPhoto.update({ where: { id: parseInt(req.params.id) }, data });
    res.json({ success: true, photo });
  } catch (error) {
    console.error('updatePhoto error:', error);
    res.status(500).json({ success: false, message: 'Failed to update photo' });
  }
};

// ── DELETE /api/photos/:id ────────────────────────────────────────────────────
const deletePhoto = async (req, res) => {
  try {
    if (!prisma.jobPhoto) return res.status(503).json({ success: false, message: 'Migration pending' });

    const photo = await prisma.jobPhoto.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const supabase = getSupabase();
    const extractPath = (url) => {
      try { return decodeURIComponent(url.split('/job-photos/')[1]?.split('?')[0]); } catch { return null; }
    };
    const paths = [extractPath(photo.beforeUrl), photo.afterUrl ? extractPath(photo.afterUrl) : null].filter(Boolean);
    if (paths.length) {
      await supabase.storage.from('job-photos').remove(paths).catch(e => console.error('Storage remove:', e.message));
    }

    await prisma.jobPhoto.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('deletePhoto error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
};

module.exports = { getPhotos, uploadPhoto, updatePhoto, deletePhoto, uploadMiddleware };