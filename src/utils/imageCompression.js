// src/utils/imageCompression.js
// Production-ready image compression pipeline for Prime Detailing
// Uses browser-image-compression with WebP output + EXIF preservation

import imageCompression from 'browser-image-compression';

// ── Compression profiles ──────────────────────────────────────────────────────
// Different quality tiers for different use cases

const PROFILES = {
  // Gallery / admin before-after — highest quality, moderate size reduction
  gallery: {
    maxSizeMB:        0.8,
    maxWidthOrHeight: 1600,
    initialQuality:   0.88,
    useWebWorker:     true,
    fileType:         'image/webp',
    preserveExifData: true,
    alwaysKeepResolution: false,
  },

  // Booking customer photo uploads — good quality, aggressive size
  booking: {
    maxSizeMB:        0.6,
    maxWidthOrHeight: 1400,
    initialQuality:   0.85,
    useWebWorker:     true,
    fileType:         'image/webp',
    preserveExifData: true,
    alwaysKeepResolution: false,
  },

  // Thumbnails / previews
  thumbnail: {
    maxSizeMB:        0.15,
    maxWidthOrHeight: 600,
    initialQuality:   0.80,
    useWebWorker:     true,
    fileType:         'image/webp',
    preserveExifData: false,
    alwaysKeepResolution: false,
  },

  // Default fallback
  default: {
    maxSizeMB:        0.8,
    maxWidthOrHeight: 1600,
    initialQuality:   0.85,
    useWebWorker:     true,
    fileType:         'image/webp',
    preserveExifData: true,
    alwaysKeepResolution: false,
  },
};

// Max input file size before we reject (50MB — avoids hanging the browser)
const MAX_INPUT_SIZE_MB = 50;

// Allowed input MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/bmp',
  'image/tiff',
];

// ── Validation ────────────────────────────────────────────────────────────────
const validateFile = (file) => {
  if (!file) throw new Error('No file provided.');

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_INPUT_SIZE_MB)
    throw new Error(`File too large (${sizeMB.toFixed(1)}MB). Maximum is ${MAX_INPUT_SIZE_MB}MB.`);

  // HEIC/HEIF might report as empty string on some browsers — allow it
  const type = file.type?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  const isAllowedType = ALLOWED_TYPES.includes(type);
  const isAllowedExt  = /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i.test(name);

  if (!isAllowedType && !isAllowedExt)
    throw new Error(`Unsupported file type (${file.type || 'unknown'}). Use JPG, PNG, or WebP.`);
};

// ── Format bytes for display ──────────────────────────────────────────────────
export const formatBytes = (bytes) => {
  if (bytes < 1024)        return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
};

// ── Core compressor ───────────────────────────────────────────────────────────
/**
 * Compress an image file.
 *
 * @param {File}   file    - Raw File object from input or drop
 * @param {string} profile - 'gallery' | 'booking' | 'thumbnail' | 'default'
 * @param {function} onProgress - optional (0–100) progress callback
 * @returns {Promise<{ file: File, stats: object }>}
 */
export const compressImage = async (file, profile = 'default', onProgress = null) => {
  validateFile(file);

  const options = {
    ...PROFILES[profile] || PROFILES.default,
    onProgress: onProgress ? (p) => onProgress(Math.round(p)) : undefined,
  };

  const originalSize = file.size;
  const originalType = file.type;

  let compressed;
  try {
    compressed = await imageCompression(file, options);
  } catch (err) {
    // Fallback: if WebP conversion fails (e.g. Safari < 16), retry without WebP
    console.warn('[imageCompression] WebP failed, retrying as JPEG:', err.message);
    try {
      compressed = await imageCompression(file, {
        ...options,
        fileType: 'image/jpeg',
      });
    } catch (fallbackErr) {
      throw new Error(`Compression failed: ${fallbackErr.message}`);
    }
  }

  const compressedSize  = compressed.size;
  const savingBytes     = originalSize - compressedSize;
  const savingPercent   = Math.round((savingBytes / originalSize) * 100);
  const outputType      = compressed.type || 'image/webp';

  // Ensure the compressed file has a proper .webp extension if format changed
  let outputFile = compressed;
  if (outputType === 'image/webp' && !compressed.name?.endsWith('.webp')) {
    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
    outputFile = new File([compressed], `${baseName}.webp`, { type: 'image/webp' });
  }

  const stats = {
    originalSize,
    originalSizeFormatted: formatBytes(originalSize),
    compressedSize,
    compressedSizeFormatted: formatBytes(compressedSize),
    savingBytes,
    savingPercent,
    originalType,
    outputType,
    didConvertToWebP: outputType === 'image/webp' && originalType !== 'image/webp',
  };

  // Console log for development visibility
  if (import.meta.env.DEV || import.meta.env.VITE_LOG_COMPRESSION) {
    console.log(
      `[Image] ${file.name} · ${stats.originalSizeFormatted} → ${stats.compressedSizeFormatted}` +
      ` (−${savingPercent}%)` +
      (stats.didConvertToWebP ? ' · converted to WebP' : '')
    );
  }

  return { file: outputFile, stats };
};

// ── Batch compressor ──────────────────────────────────────────────────────────
/**
 * Compress multiple files, reporting per-file progress.
 *
 * @param {FileList|File[]} files
 * @param {string}          profile
 * @param {function}        onFileProgress - ({ index, total, fileName, progress }) => void
 * @returns {Promise<Array<{ file: File, stats: object } | { error: string, originalFile: File }>>}
 */
export const compressImages = async (files, profile = 'default', onFileProgress = null) => {
  const arr = Array.from(files);
  const results = [];

  for (let i = 0; i < arr.length; i++) {
    const f = arr[i];
    try {
      const result = await compressImage(
        f,
        profile,
        onFileProgress
          ? (p) => onFileProgress({ index: i, total: arr.length, fileName: f.name, progress: p })
          : null
      );
      results.push(result);
    } catch (err) {
      results.push({ error: err.message, originalFile: f });
    }
  }

  return results;
};

// ── Create object URL preview from compressed file ────────────────────────────
export const createPreviewUrl = (file) => URL.createObjectURL(file);

// ── Convert File to base64 (for JSON-based upload endpoints) ─────────────────
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default compressImage;
