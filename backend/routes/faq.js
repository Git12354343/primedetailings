// backend/routes/faq.js
// GET /api/faq         — public, returns active FAQ items
// PUT /api/admin/faq   — admin, saves FAQ items array

'use strict';

const express        = require('express');
const router         = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma         = new PrismaClient();

const requireAdmin = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET)
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

const FAQ_KEY = 'faq_items';

const DEFAULT_FAQ = [
  { id: 1, q: 'Do you come to my location?',                          a: 'Yes! We are 100% mobile. We bring all professional equipment and come to your home, office, or anywhere in Greater Montreal.' },
  { id: 2, q: 'How long does a full detail take?',                    a: 'A standard full detail takes 3–5 hours depending on vehicle size and condition. Ceramic coating packages can take a full day.' },
  { id: 3, q: 'What is ceramic coating and how long does it last?',   a: "Ceramic coating is a liquid polymer that chemically bonds to your vehicle's paint, creating a hard protective shell. Our coatings last 3–5 years with proper maintenance." },
  { id: 4, q: 'Do I need to prepare my car before the appointment?',  a: 'Just make sure we have access to your vehicle. We handle everything else. If possible, remove personal items from the interior.' },
  { id: 5, q: 'What areas do you service in Québec?',                 a: 'We cover Greater Montréal, Laval, Longueuil, the South Shore, the North Shore, Québec City and surrounding regions.' },
  { id: 6, q: 'Do you offer any warranty?',                           a: "Yes. We stand behind our work 100%. Our ceramic coatings come with a warranty, and we'll address any concerns immediately after the service." },
];

// ── GET /api/faq ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: FAQ_KEY } });
    const items = Array.isArray(row?.value) ? row.value : DEFAULT_FAQ;
    res.json({ success: true, items });
  } catch (err) {
    console.error('GET /faq error:', err);
    res.json({ success: true, items: DEFAULT_FAQ }); // never fail publicly
  }
});

// ── PUT /api/faq (admin) ──────────────────────────────────────────────────────
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items))
      return res.status(400).json({ success: false, message: 'items must be an array' });

    // Sanitize + assign stable ids
    const sanitized = items
      .filter(i => i.q?.trim() && i.a?.trim())
      .map((i, idx) => ({
        id: i.id || Date.now() + idx,
        q:  String(i.q).trim(),
        a:  String(i.a).trim(),
      }));

    await prisma.appConfig.upsert({
      where:  { key: FAQ_KEY },
      update: { value: sanitized },
      create: { key: FAQ_KEY, value: sanitized },
    });

    res.json({ success: true, items: sanitized });
  } catch (err) {
    console.error('PUT /faq error:', err);
    res.status(500).json({ success: false, message: 'Failed to save FAQ' });
  }
});

module.exports = router;
