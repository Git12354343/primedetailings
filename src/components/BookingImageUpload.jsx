// src/components/BookingImageUpload.jsx
// Customer vehicle photo upload with automatic compression + WebP conversion
// Self-contained — requires: npm install browser-image-compression

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import imageCompression from 'browser-image-compression';

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL   = import.meta.env.VITE_API_URL || '/api';
const MAX_FILES = 5;
const MAX_INPUT_MB = 50;
const GOLD_S    = '#c9a84c';
const GOLD      = 'linear-gradient(135deg, #c9a84c, #f5d376)';

const ALLOWED = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/heic', 'image/heif',
];

const COMPRESSION_OPTIONS = {
  maxSizeMB:        0.6,
  maxWidthOrHeight: 1400,
  initialQuality:   0.85,
  useWebWorker:     true,
  fileType:         'image/webp',
  preserveExifData: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes < 1024)         return `${bytes}B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

// ── Compress a single file ────────────────────────────────────────────────────
const compressFile = async (file, onProgress) => {
  const originalSize = file.size;

  let compressed;
  try {
    compressed = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      onProgress,
    });
  } catch {
    // WebP fallback — some older Safari versions
    compressed = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      fileType:  'image/jpeg',
      onProgress,
    });
  }

  // Rename to .webp if format changed
  const isWebP = compressed.type === 'image/webp';
  let outputFile = compressed;
  if (isWebP && !compressed.name?.endsWith('.webp')) {
    const base = (file.name || 'photo').replace(/\.[^.]+$/, '');
    outputFile = new File([compressed], `${base}.webp`, { type: 'image/webp' });
  }

  const compressedSize  = outputFile.size;
  const savingBytes     = originalSize - compressedSize;
  const savingPercent   = Math.max(0, Math.round((savingBytes / originalSize) * 100));

  if (import.meta.env.DEV) {
    console.log(
      `[Booking Upload] ${file.name} · ` +
      `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} ` +
      `(−${savingPercent}%)${isWebP ? ' · WebP' : ''}`
    );
  }

  return {
    file: outputFile,
    stats: {
      originalSize,
      compressedSize,
      savingBytes,
      savingPercent,
      originalSizeFmt:    formatBytes(originalSize),
      compressedSizeFmt:  formatBytes(compressedSize),
      didConvertToWebP:   isWebP && file.type !== 'image/webp',
    },
  };
};

// ── Compression progress ring ─────────────────────────────────────────────────
const ProgressRing = ({ progress = 0 }) => {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-9 h-9 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="36" height="36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={GOLD_S}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (progress / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>
      <span style={{ color: GOLD_S, fontSize: '8px', fontWeight: 700 }}>{progress}%</span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const BookingImageUpload = ({ bookingId, onImagesChange }) => {
  // Each image: { tempId, preview, status, progress, stats, id, publicUrl, error }
  const [images,   setImages]   = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // ── Upload one compressed file to backend ─────────────────────────────────
  const uploadToBackend = useCallback(async (file, bookingIdVal) => {
    const base64 = await fileToBase64(file);
    const res = await fetch(`${API_URL}/images/upload/quote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        fileName:   file.name,
        mimeType:   file.type,
        fileSize:   file.size,
        fileBase64: base64,
        bookingId:  bookingIdVal || null,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.image;
  }, []);

  // ── Process: validate → compress → upload ────────────────────────────────
  const processFile = useCallback(async (rawFile) => {
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Validate type
    const type = rawFile.type?.toLowerCase() || '';
    const name = rawFile.name?.toLowerCase() || '';
    const okType = ALLOWED.includes(type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(name);
    if (!okType) {
      setImages(prev => [...prev, {
        tempId, preview: null,
        status: 'error',
        error:  `${rawFile.name}: unsupported type. Use JPG, PNG or WebP.`,
      }]);
      return;
    }

    // Validate size
    const sizeMB = rawFile.size / (1024 * 1024);
    if (sizeMB > MAX_INPUT_MB) {
      setImages(prev => [...prev, {
        tempId, preview: null,
        status: 'error',
        error:  `${rawFile.name}: too large (${sizeMB.toFixed(1)}MB). Max ${MAX_INPUT_MB}MB.`,
      }]);
      return;
    }

    // Add placeholder — show original preview while compressing
    const originalPreview = URL.createObjectURL(rawFile);
    setImages(prev => [...prev, {
      tempId,
      preview:  originalPreview,
      status:   'compressing',
      progress: 0,
      stats:    null,
    }]);

    // Compress
    let compressed, stats;
    try {
      const result = await compressFile(rawFile, (p) => {
        setImages(prev =>
          prev.map(i => i.tempId === tempId ? { ...i, progress: p } : i)
        );
      });
      compressed = result.file;
      stats      = result.stats;
    } catch (err) {
      URL.revokeObjectURL(originalPreview);
      setImages(prev =>
        prev.map(i =>
          i.tempId === tempId
            ? { ...i, status: 'error', error: `Compression failed: ${err.message}` }
            : i
        )
      );
      return;
    }

    // Swap preview to compressed version
    const compressedPreview = URL.createObjectURL(compressed);
    URL.revokeObjectURL(originalPreview);
    setImages(prev =>
      prev.map(i =>
        i.tempId === tempId
          ? { ...i, status: 'uploading', preview: compressedPreview, stats, progress: 100 }
          : i
      )
    );

    // Upload
    try {
      const image = await uploadToBackend(compressed, bookingId);
      setImages(prev => {
        const next = prev.map(i =>
          i.tempId === tempId
            ? { ...i, status: 'done', id: image.id, publicUrl: image.publicUrl }
            : i
        );
        onImagesChange?.(next.filter(i => i.status === 'done').map(i => i.id));
        return next;
      });
    } catch (err) {
      setImages(prev =>
        prev.map(i =>
          i.tempId === tempId
            ? { ...i, status: 'error', error: err.message }
            : i
        )
      );
    }
  }, [bookingId, uploadToBackend, onImagesChange]);

  // ── Handle file list from input or drop ──────────────────────────────────
  const handleFiles = useCallback((fileList) => {
    const doneCount = images.filter(i => i.status === 'done').length;
    const remaining = MAX_FILES - doneCount;
    if (remaining <= 0) return;
    Array.from(fileList).slice(0, remaining).forEach(f => processFile(f));
  }, [images, processFile]);

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeImage = useCallback(async (img) => {
    // Try to delete from backend if uploaded
    if (img.id) {
      try { await fetch(`${API_URL}/images/${img.id}`, { method: 'DELETE' }); } catch {}
    }
    if (img.preview) URL.revokeObjectURL(img.preview);
    setImages(prev => {
      const next = prev.filter(i => i.tempId !== img.tempId);
      onImagesChange?.(next.filter(i => i.status === 'done').map(i => i.id));
      return next;
    });
  }, [onImagesChange]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const doneCount  = images.filter(i => i.status === 'done').length;
  const canAdd     = doneCount < MAX_FILES;
  const totalSaved = images.reduce((s, i) => s + (i.stats?.savingBytes || 0), 0);
  const webpCount  = images.filter(i => i.stats?.didConvertToWebP).length;

  return (
    <div>
      {/* ── Drop zone ── */}
      {canAdd && (
        <div
          className="relative rounded-2xl cursor-pointer transition-all duration-200"
          style={{
            border:     `2px dashed ${dragOver ? GOLD_S : 'rgba(255,255,255,0.15)'}`,
            background:  dragOver ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
            padding:    '24px',
            textAlign:  'center',
            transform:   dragOver ? 'scale(1.005)' : 'scale(1)',
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e  => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={()  => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: dragOver ? GOLD : 'rgba(255,255,255,0.06)' }}
          >
            <Upload
              className="w-5 h-5"
              style={{ color: dragOver ? '#000' : GOLD_S, opacity: dragOver ? 1 : 0.75 }}
            />
          </div>

          <p className="text-white font-semibold text-sm mb-1">
            Drop photos here or{' '}
            <span style={{ color: GOLD_S }}>browse</span>
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            JPG, PNG, WebP · Auto-compressed to WebP · Up to {MAX_FILES} photos
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* ── Preview grid ── */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {images.map((img) => (
            <div
              key={img.tempId}
              className="relative rounded-xl overflow-hidden group"
              style={{
                aspectRatio: '1',
                background:  'rgba(255,255,255,0.05)',
              }}
            >
              {/* Preview image */}
              {img.preview && (
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    filter:     img.status === 'compressing' ? 'brightness(0.35)' : 'none',
                    transition: 'filter 0.25s',
                  }}
                />
              )}

              {/* ── Compressing overlay ── */}
              {img.status === 'compressing' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                >
                  <ProgressRing progress={img.progress || 0} />
                  <span
                    className="font-semibold"
                    style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9px' }}
                  >
                    Optimizing
                  </span>
                </div>
              )}

              {/* ── Uploading overlay ── */}
              {img.status === 'uploading' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: GOLD_S }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px' }}>
                    Uploading
                  </span>
                </div>
              )}

              {/* ── Error overlay ── */}
              {img.status === 'error' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
                  style={{ background: 'rgba(0,0,0,0.82)' }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p
                    className="text-red-400 text-center leading-tight"
                    style={{ fontSize: '9px' }}
                  >
                    {img.error}
                  </p>
                </div>
              )}

              {/* ── Done: compression badge ── */}
              {img.status === 'done' && img.stats?.savingPercent > 0 && (
                <div
                  className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
                >
                  <Zap className="w-2.5 h-2.5" style={{ color: GOLD_S }} />
                  <span style={{ color: '#f5d376', fontSize: '9px', fontWeight: 700 }}>
                    −{img.stats.savingPercent}%
                  </span>
                </div>
              )}

              {/* ── Done: check ── */}
              {img.status === 'done' && (
                <div
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full
                             flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                </div>
              )}

              {/* ── Remove button ── */}
              {img.status !== 'compressing' && img.status !== 'uploading' && (
                <button
                  onClick={e => { e.stopPropagation(); removeImage(img); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full
                             flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'rgba(0,0,0,0.75)',
                    border:     '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Summary bar ── */}
      {doneCount > 0 && (
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {doneCount} photo{doneCount > 1 ? 's' : ''} uploaded · attached to your booking
            </p>
          </div>

          {totalSaved > 1024 && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 flex-shrink-0" style={{ color: GOLD_S }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {formatBytes(totalSaved)} saved
              </span>
              {webpCount > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    background: 'rgba(201,168,76,0.1)',
                    color:      GOLD_S,
                    fontSize:   '9px',
                    fontWeight: 600,
                  }}
                >
                  WebP
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingImageUpload;
