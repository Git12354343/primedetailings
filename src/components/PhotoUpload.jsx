// src/components/PhotoUpload.jsx — multi-photo upload with client-side compression
import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2, Image } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const MAX_FILES = 8;
const MAX_PX    = 1920;  // max dimension
const QUALITY   = 0.82;

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', QUALITY);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const toBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const PhotoUpload = ({ quoteId, onUploadComplete }) => {
  const [files,    setFiles]    = useState([]); // { url, name, status, error }
  const [uploading,setUploading]= useState(false);
  const inputRef = useRef();

  const pickFiles = async (raw) => {
    const chosen = Array.from(raw).slice(0, MAX_FILES - files.length);
    const previews = chosen.map(f => ({ url: URL.createObjectURL(f), name: f.name, file: f, status: 'pending' }));
    setFiles(p => [...p, ...previews]);
  };

  const uploadAll = async () => {
    if (!quoteId) return;
    setUploading(true);
    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'pending') continue;
      try {
        updated[i].status = 'uploading';
        setFiles([...updated]);
        const blob = await compressImage(updated[i].file);
        const b64  = await toBase64(blob);
        const res  = await fetch(`${API}/images/upload/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: b64, fileName: updated[i].name, quoteId }),
        });
        const data = await res.json();
        updated[i].status = data.success ? 'done' : 'error';
        updated[i].savedUrl = data.url;
        if (!data.success) updated[i].error = data.message || 'Upload failed';
      } catch (e) {
        updated[i].status = 'error';
        updated[i].error = e.message;
      }
    }
    setFiles([...updated]);
    setUploading(false);
    onUploadComplete?.(updated.filter(f => f.status === 'done').map(f => f.savedUrl));
  };

  const remove = (i) => setFiles(p => { const n = [...p]; URL.revokeObjectURL(n[i].url); n.splice(i, 1); return n; });

  const STATUS_ICON = { pending: null, uploading: <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />, done: <span className="text-green-400 text-xs">✓</span>, error: <span className="text-red-400 text-xs">✗</span> };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {files.map((f, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
            <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 flex gap-1 items-center">
              {STATUS_ICON[f.status]}
              <button onClick={() => remove(i)} className="w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ))}
        {files.length < MAX_FILES && (
          <button onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.2)', minHeight:'44px' }}>
            <Camera className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600 text-[10px]">Add photo</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { pickFiles(e.target.files); e.target.value = ''; }} />

      {files.some(f => f.status === 'pending') && (
        <button onClick={uploadAll} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#0b0f1a] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload {files.filter(f=>f.status==='pending').length} Photo{files.filter(f=>f.status==='pending').length !== 1 ? 's' : ''}</>}
        </button>
      )}
      {files.some(f => f.status === 'error') && (
        <p className="text-red-400 text-xs mt-1">Some uploads failed — please try again.</p>
      )}
      <p className="text-gray-600 text-xs mt-1">Max {MAX_FILES} photos. Compressed automatically.</p>
    </div>
  );
};

export default PhotoUpload;
