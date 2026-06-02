// backend/services/imageCleanupService.js
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: WebSocket
    }
  }
);

const QUOTE_BUCKET   = 'quote-uploads';
const ORPHAN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Schedule temporary images for deletion when a booking ends.
 * Called by bookingController when status → COMPLETED | CANCELED | NO_SHOW
 */
async function scheduleImageDeletion(bookingId) {
  const deleteAfter = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h grace period

  const updated = await prisma.bookingImage.updateMany({
    where: {
      bookingId: parseInt(bookingId),
      isTemporary: true,
    },
    data: {
      deleteAfter,
    },
  });

  if (updated.count > 0) {
    console.log(
      `[ImageCleanup] Scheduled ${updated.count} images for deletion (bookingId=${bookingId})`
    );
  }
}

/**
 * Delete expired temporary images.
 * Called daily by the scheduler.
 */
async function cleanupExpiredImages() {
  const now = new Date();

  // Find expired temporary images
  const expired = await prisma.bookingImage.findMany({
    where: {
      isTemporary: true,
      deleteAfter: {
        lte: now,
      },
    },
  });

  let deleted = 0;
  let errors = 0;

  for (const img of expired) {
    try {
      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from(QUOTE_BUCKET)
        .remove([img.storagePath]);

      if (error) {
        console.error(
          `[ImageCleanup] Storage delete failed for ${img.storagePath}:`,
          error.message
        );
        errors++;
        continue;
      }

      // Delete DB record
      await prisma.bookingImage.delete({
        where: {
          id: img.id,
        },
      });

      deleted++;
    } catch (err) {
      console.error(
        `[ImageCleanup] Error deleting image id=${img.id}:`,
        err.message
      );
      errors++;
    }
  }

  // Also clean up orphaned images (no bookingId, older than 30 days)
  const orphanCutoff = new Date(Date.now() - ORPHAN_MAX_AGE);

  const orphans = await prisma.bookingImage.findMany({
    where: {
      isTemporary: true,
      bookingId: null,
      createdAt: {
        lte: orphanCutoff,
      },
    },
  });

  for (const img of orphans) {
    try {
      await supabase.storage
        .from(QUOTE_BUCKET)
        .remove([img.storagePath]);

      await prisma.bookingImage.delete({
        where: {
          id: img.id,
        },
      });

      deleted++;
    } catch (err) {
      console.error(
        `[ImageCleanup] Orphan delete error id=${img.id}:`,
        err.message
      );
      errors++;
    }
  }

  console.log(
    `[ImageCleanup] Done — deleted: ${deleted}, errors: ${errors}`
  );

  return { deleted, errors };
}

module.exports = {
  scheduleImageDeletion,
  cleanupExpiredImages,
};
