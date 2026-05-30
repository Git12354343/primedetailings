// src/hooks/useImageUpload.js
// Reusable hook — handles compress → preview → upload for any image input
// Drop into any component that needs file upload with compression

import { useState, useCallback, useRef } from 'react';
import { compressImage, compressImages, fileToBase64, createPreviewUrl, formatBytes } from '../utils/imageCompression';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Upload strategies ─────────────────────────────────────────────────────────
// 'base64'   — JSON body with fileBase64 field (BookingImageUpload endpoint)
// 'formdata' — multipart/form-data (GalleryManagement /photos/upload endpoint)

/**
 * Upload a single compressed file via base64 JSON.
 */
const uploadBase64 = async (file, extraFields = {}) => {
  const base64 = await fileToBase64(file);
  const res = await fetch(`${API_URL}/images/upload/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName:   file.name,
      mimeType:   file.type,
      fileSize:   file.size,
      fileBase64: base64,
      ...extraFields,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return data.image;
};

/**
 * Upload a single compressed file via FormData (gallery/photos endpoint).
 */
const uploadFormData = async (file, fieldName, extraFields = {}, adminToken = null) => {
  const fd = new FormData();
  fd.append(fieldName, file);
  Object.entries(extraFields).forEach(([k, v]) => v !== null && v !== undefined && fd.append(k, v));

  const headers = adminToken ? { 'X-Admin-Secret': adminToken } : {};
  const res = await fetch(`${API_URL}/photos/upload`, {
    method: 'POST',
    headers,
    body: fd,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data.photo;
};

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * useImageUpload
 *
 * @param {object} options
 *   - strategy:    'base64' | 'formdata'
 *   - profile:     compression profile ('gallery' | 'booking' | 'default')
 *   - maxFiles:    maximum number of files
 *   - maxInputMB:  reject files larger than this (before compression)
 *   - adminToken:  for formdata uploads requiring auth
 *   - fieldName:   FormData field name (formdata strategy)
 *   - extraFields: additional fields to send with each upload
 *   - onDone:      callback(uploadedItems) — called after each successful upload
 */
const useImageUpload = ({
  strategy    = 'base64',
  profile     = 'default',
  maxFiles    = 10,
  maxInputMB  = 50,
  adminToken  = null,
  fieldName   = 'image',
  extraFields = {},
  onDone      = null,
} = {}) => {
  const [items, setItems]   = useState([]); // { tempId, file, preview, status, stats, id, publicUrl, error }
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // ── Process + compress + upload one file ─────────────────────────────────
  const processFile = useCallback(async (rawFile) => {
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Validate size before compression
    const sizeMB = rawFile.size / (1024 * 1024);
    if (sizeMB > maxInputMB) {
      setItems(prev => [...prev, {
        tempId,
        file: rawFile,
        preview: null,
        status: 'error',
        error: `File too large (${sizeMB.toFixed(1)}MB). Max ${maxInputMB}MB.`,
        stats: null,
      }]);
      return;
    }

    // Add placeholder with compressing state
    setItems(prev => [...prev, {
      tempId,
      file: rawFile,
      preview: createPreviewUrl(rawFile), // show original while compressing
      status: 'compressing',
      progress: 0,
      stats: null,
    }]);

    // Compress
    let compressed, stats;
    try {
      const result = await compressImage(rawFile, profile, (p) => {
        setItems(prev => prev.map(i => i.tempId === tempId ? { ...i, progress: p } : i));
      });
      compressed = result.file;
      stats      = result.stats;
    } catch (err) {
      setItems(prev => prev.map(i =>
        i.tempId === tempId ? { ...i, status: 'error', error: `Compression failed: ${err.message}` } : i
      ));
      return;
    }

    // Update preview with compressed version
    const compressedPreview = createPreviewUrl(compressed);
    setItems(prev => prev.map(i =>
      i.tempId === tempId
        ? { ...i, status: 'uploading', preview: compressedPreview, stats, progress: 100 }
        : i
    ));

    // Upload
    try {
      let result;
      if (strategy === 'formdata') {
        result = await uploadFormData(compressed, fieldName, extraFields, adminToken);
      } else {
        result = await uploadBase64(compressed, extraFields);
      }

      setItems(prev => {
        const next = prev.map(i =>
          i.tempId === tempId
            ? { ...i, status: 'done', id: result.id, publicUrl: result.publicUrl || result.beforeUrl || result.url }
            : i
        );
        onDone?.(next.filter(i => i.status === 'done'));
        return next;
      });
    } catch (err) {
      setItems(prev => prev.map(i =>
        i.tempId === tempId ? { ...i, status: 'error', error: err.message } : i
      ));
    }
  }, [profile, maxInputMB, strategy, fieldName, extraFields, adminToken, onDone]);

  // ── Handle file list (from input or drop) ─────────────────────────────────
  const handleFiles = useCallback((fileList) => {
    const current = items.filter(i => i.status === 'done').length;
    const remaining = maxFiles - current;
    if (remaining <= 0) return;

    const toProcess = Array.from(fileList).slice(0, remaining);
    toProcess.forEach(f => processFile(f));
  }, [items, maxFiles, processFile]);

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItem = useCallback(async (tempId) => {
    setItems(prev => {
      const item = prev.find(i => i.tempId === tempId);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      // Optionally delete from backend here if needed
      const next = prev.filter(i => i.tempId !== tempId);
      onDone?.(next.filter(i => i.status === 'done'));
      return next;
    });
  }, [onDone]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const dragHandlers = {
    onDragOver:  (e) => { e.preventDefault(); setDragOver(true); },
    onDragLeave: ()  => setDragOver(false),
    onDrop:      (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); },
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const doneItems       = items.filter(i => i.status === 'done');
  const hasError        = items.some(i => i.status === 'error');
  const isProcessing    = items.some(i => i.status === 'compressing' || i.status === 'uploading');
  const canAdd          = doneItems.length < maxFiles;
  const totalSaved      = items.reduce((sum, i) => sum + (i.stats?.savingBytes || 0), 0);

  return {
    items,
    doneItems,
    dragOver,
    dragHandlers,
    handleFiles,
    removeItem,
    inputRef,
    isProcessing,
    hasError,
    canAdd,
    totalSaved,
    formatBytes,
  };
};

export default useImageUpload;
