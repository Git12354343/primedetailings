// src/components/BookingImageUpload.jsx
// Optional step in booking flow — customer uploads vehicle photos
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_FILES = 5;
const MAX_SIZE  = 10 * 1024 * 1024; // 10MB
const GOLD_S    = '#c9a84c';
const ALLOWED   = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

const BookingImageUpload = ({ bookingId, onImagesChange }) => {
  const [images, setImages]   = useState([]);  // { id, publicUrl, file, status: 'uploading'|'done'|'error' }
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const uploadFile = useCallback(async (file) => {
    if (!ALLOWED.includes(file.type))
      return { error: `${file.name}: Invalid type. Use JPG, PNG, or WebP.` };
    if (file.size > MAX_SIZE)
      return { error: `${file.name}: Too large (max 10MB).` };

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        try {
          const res = await fetch(`${API_URL}/images/upload/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              fileBase64: base64,
              bookingId: bookingId || null,
            }),
          });
          const data = await res.json();
          if (data.success) resolve({ id: data.image.id, publicUrl: data.image.publicUrl });
          else resolve({ error: data.error || 'Upload failed' });
        } catch {
          resolve({ error: 'Network error' });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [bookingId]);

  const handleFiles = useCallback(async (files) => {
    const remaining = MAX_FILES - images.filter(i => i.status === 'done').length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      setImages(prev => [...prev, {
        tempId, file,
        preview: URL.createObjectURL(file),
        status: 'uploading',
      }]);

      const result = await uploadFile(file);

      setImages(prev => prev.map(img =>
        img.tempId === tempId
          ? result.error
            ? { ...img, status: 'error', error: result.error }
            : { ...img, status: 'done', id: result.id, publicUrl: result.publicUrl }
          : img
      ));

      if (!result.error) {
        setImages(prev => {
          const done = prev.filter(i => i.status === 'done').map(i => i.id);
          onImagesChange?.(done);
          return prev;
        });
      }
    }
  }, [images, uploadFile, onImagesChange]);

  const removeImage = async (img) => {
    if (img.id) {
      try {
        await fetch(`${API_URL}/images/${img.id}`, { method: 'DELETE' });
      } catch {}
    }
    if (img.preview) URL.revokeObjectURL(img.preview);
    setImages(prev => {
      const next = prev.filter(i => i.tempId !== img.tempId);
      onImagesChange?.(next.filter(i => i.status === 'done').map(i => i.id));
      return next;
    });
  };

  const doneCount = images.filter(i => i.status === 'done').length;
  const canAdd    = doneCount < MAX_FILES;

  return (
    <div>
      {/* Drop zone */}
      {canAdd && (
        <div
          className="relative rounded-2xl transition-all cursor-pointer"
          style={{
            border: `2px dashed ${dragOver ? GOLD_S : 'rgba(255,255,255,0.15)'}`,
            background: dragOver ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
            padding: '24px',
            textAlign: 'center',
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="w-7 h-7 mx-auto mb-2" style={{ color: GOLD_S, opacity: 0.7 }} />
          <p className="text-white font-semibold text-sm mb-1">
            Drop photos here or <span style={{ color: GOLD_S }}>browse</span>
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            JPG, PNG, WebP · Max 10MB · Up to {MAX_FILES} photos
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

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {images.map((img) => (
            <div key={img.tempId} className="relative rounded-xl overflow-hidden aspect-square"
              style={{ background: 'rgba(255,255,255,0.05)' }}>

              {img.preview && (
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
              )}

              {/* Status overlay */}
              {img.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD_S }} />
                </div>
              )}
              {img.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2"
                  style={{ background: 'rgba(0,0,0,0.75)' }}>
                  <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                  <p className="text-red-400 text-xs text-center leading-tight">{img.error}</p>
                </div>
              )}

              {/* Remove button */}
              {img.status !== 'uploading' && (
                <button
                  onClick={e => { e.stopPropagation(); removeImage(img); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {doneCount > 0 && (
        <p className="text-xs mt-2 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {doneCount} photo{doneCount > 1 ? 's' : ''} uploaded · These will be attached to your booking
        </p>
      )}
    </div>
  );
};

export default BookingImageUpload;
