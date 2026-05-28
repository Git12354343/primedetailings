// backend/routes/training.js
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

// ── PUBLIC / DETAILER ─────────────────────────────────────────────────────────

// GET /api/training/modules — all published modules
router.get('/modules', verifyToken, async (req, res) => {
  try {
    const modules = await prisma.trainingModule.findMany({
      where: { isPublished: true },
      include: { _count: { select: { quizzes: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, modules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/training/modules/:id — single module + quizzes (questions only, no answers)
router.get('/modules/:id', verifyToken, async (req, res) => {
  try {
    const module = await prisma.trainingModule.findFirst({
      where: { id: parseInt(req.params.id), isPublished: true },
      include: {
        quizzes: {
          select: {
            id: true, question: true, questionFr: true,
            options: true, optionsFr: true, sortOrder: true,
            // correctIdx and explanation NOT returned to detailer until after submit
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!module) return res.status(404).json({ success: false, error: 'Module not found' });
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/training/progress — detailer's own progress
router.get('/progress', verifyToken, async (req, res) => {
  try {
    const progress = await prisma.trainingProgress.findMany({
      where: { detailerId: req.detailer.id },
      include: { module: { select: { id: true, title: true, isRequired: true, category: true } } },
    });
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/training/progress/:moduleId/start
router.post('/progress/:moduleId/start', verifyToken, async (req, res) => {
  try {
    const progress = await prisma.trainingProgress.upsert({
      where: { detailerId_moduleId: { detailerId: req.detailer.id, moduleId: parseInt(req.params.moduleId) } },
      update: { status: 'IN_PROGRESS', startedAt: new Date() },
      create: {
        detailerId: req.detailer.id,
        moduleId: parseInt(req.params.moduleId),
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/training/quiz/:moduleId/submit — submit answers, get score + correct answers
router.post('/quiz/:moduleId/submit', verifyToken, async (req, res) => {
  try {
    const { answers } = req.body; // { [quizId]: selectedIdx }
    const moduleId = parseInt(req.params.moduleId);

    const quizzes = await prisma.trainingQuiz.findMany({
      where: { moduleId },
      orderBy: { sortOrder: 'asc' },
    });

    if (!quizzes.length) {
      // No quiz — just mark complete
      await prisma.trainingProgress.upsert({
        where: { detailerId_moduleId: { detailerId: req.detailer.id, moduleId } },
        update: { status: 'COMPLETED', completedAt: new Date(), score: 100 },
        create: { detailerId: req.detailer.id, moduleId, status: 'COMPLETED', completedAt: new Date(), score: 100 },
      });
      return res.json({ success: true, score: 100, passed: true, results: [] });
    }

    let correct = 0;
    const results = quizzes.map(q => {
      const selected = answers?.[q.id];
      const isCorrect = selected === q.correctIdx;
      if (isCorrect) correct++;
      return { id: q.id, correctIdx: q.correctIdx, selectedIdx: selected, isCorrect, explanation: q.explanation, explanationFr: q.explanationFr };
    });

    const score  = Math.round((correct / quizzes.length) * 100);
    const passed = score >= 70;

    await prisma.trainingProgress.upsert({
      where: { detailerId_moduleId: { detailerId: req.detailer.id, moduleId } },
      update: {
        status: passed ? 'COMPLETED' : 'FAILED',
        score,
        completedAt: passed ? new Date() : null,
        attempts: { increment: 1 },
      },
      create: {
        detailerId: req.detailer.id,
        moduleId,
        status: passed ? 'COMPLETED' : 'FAILED',
        score,
        completedAt: passed ? new Date() : null,
        attempts: 1,
      },
    });

    res.json({ success: true, score, passed, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/training/admin/modules — all modules including drafts
router.get('/admin/modules', requireAdmin, async (req, res) => {
  try {
    const modules = await prisma.trainingModule.findMany({
      include: {
        _count: { select: { quizzes: true, progress: true } },
        quizzes: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, modules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/training/admin/modules
router.post('/admin/modules', requireAdmin, async (req, res) => {
  try {
    const { title, titleFr, description, descriptionFr, content, contentFr,
            category, level, isRequired, sortOrder, estimatedMinutes, thumbnailUrl } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, error: 'title and content required' });
    const module = await prisma.trainingModule.create({
      data: { title, titleFr, description, descriptionFr, content, contentFr,
              category: category || 'GENERAL', level: level || 'BEGINNER',
              isRequired: !!isRequired, sortOrder: sortOrder || 0,
              estimatedMinutes, thumbnailUrl, createdBy: 'admin' },
    });
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/training/admin/modules/:id
router.put('/admin/modules/:id', requireAdmin, async (req, res) => {
  try {
    const module = await prisma.trainingModule.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/training/admin/modules/:id/publish
router.patch('/admin/modules/:id/publish', requireAdmin, async (req, res) => {
  try {
    const module = await prisma.trainingModule.update({
      where: { id: parseInt(req.params.id) },
      data: { isPublished: req.body.isPublished },
    });
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/training/admin/modules/:id
router.delete('/admin/modules/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.trainingModule.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/training/admin/modules/:id/quiz — add question
router.post('/admin/modules/:id/quiz', requireAdmin, async (req, res) => {
  try {
    const { question, questionFr, options, optionsFr, correctIdx, explanation, explanationFr, sortOrder } = req.body;
    const quiz = await prisma.trainingQuiz.create({
      data: {
        moduleId: parseInt(req.params.id),
        question, questionFr,
        options: JSON.stringify(options),
        optionsFr: optionsFr ? JSON.stringify(optionsFr) : null,
        correctIdx: parseInt(correctIdx),
        explanation, explanationFr,
        sortOrder: sortOrder || 0,
      },
    });
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/training/admin/progress — all detailer progress
router.get('/admin/progress', requireAdmin, async (req, res) => {
  try {
    const progress = await prisma.trainingProgress.findMany({
      include: {
        detailer: { select: { id: true, name: true, email: true } },
        module: { select: { id: true, title: true, isRequired: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
