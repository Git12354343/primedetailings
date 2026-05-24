import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, Trash2, Star, StarOff, Loader2,
  AlertCircle, CheckCircle, X, Plus, Edit3
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

const SERVICE_TYPES = ['Full Detail', 'Interior', 'Exterior', 'Ceramic Coat', 'Paint Correction', 'Engine Bay'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Van'];

// ── Image picker — stores raw File object, shows preview via object URL ──────
const ImagePicker = ({ label, file: fileProp, onChange }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!fileProp) { setPreview(null); return; }
    const url = URL.createObjectURL(fileProp);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [fileProp]);

  const handleFile = (file) => {
    if (!file) return;
    onChange(file); // pass raw File — FormData will handle it
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(201,168,76,0.8)' }}>{label}</p>
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group"
        style={{ height: '120px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)' }}
        onClick={() => inputRef.current?.click()}>
        {preview
          ? <img src={preview} alt={label} className="w-full h-full object-cover" />
          : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.25)' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to upload</p>
            </div>
          )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs font-semibold text-white">Change image</p>
        </div>
        {fileProp && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.6)' }}>
            {(fileProp.size / 1024 / 1024).toFixed(1)}MB
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
      </div>
    </div>
  );
};

// ── Upload modal ──────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onUploaded, adminToken }) => {
  const [form, setForm] = useState({ vehicle: 'Sedan', serviceType: 'Full Detail', caption: '', beforeFile: null, afterFile: null });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleUpload = async () => {
    if (!form.beforeFile) { setError('Before image is required'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('beforeImage', form.beforeFile);
      if (form.afterFile) fd.append('afterImage', form.afterFile);
      fd.append('vehicle',     form.vehicle);
      fd.append('serviceType', form.serviceType);
      fd.append('caption',     form.caption || '');
      fd.append('uploadedBy',  'Admin');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/photos/upload`, {
        method: 'POST',
        headers: adminToken ? { 'X-Admin-Secret': adminToken } : {},
        body: fd,
      });
      const data = await res.json();
      if (data.success) { onUploaded(data.photo); onClose(); }
      else setError(data.message || 'Upload failed');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const iStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '9px 12px', fontSize: '13px', outline: 'none', cursor: 'pointer' };
  const lStyle = { display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.8)', marginBottom: '6px' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" style={{ color: GOLD_S }} />
            <h3 className="font-bold text-white">Upload Before & After</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lStyle}>Vehicle</label>
              <select style={iStyle} value={form.vehicle}
                onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))}>
                {VEHICLE_TYPES.map(v => <option key={v} value={v} style={{ background: '#1a1a1a' }}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>Service Type</label>
              <select style={iStyle} value={form.serviceType}
                onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}>
                {SERVICE_TYPES.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lStyle}>Caption (optional)</label>
            <input style={iStyle} value={form.caption} placeholder="e.g. 2022 BMW 3 Series — Full Detail"
              onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ImagePicker label="Before *" value={form.beforeImage}
              onChange={v => setForm(p => ({ ...p, beforeImage: v }))} />
            <ImagePicker label="After" value={form.afterImage}
              onChange={v => setForm(p => ({ ...p, afterImage: v }))} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={handleUpload} disabled={saving || !form.beforeImage}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: GOLD }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const GalleryManagement = ({ adminToken }) => {
  const [photos, setPhotos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const { success, error: notifyErr } = useNotifications();

  const authHeaders = adminToken ? { 'X-Admin-Secret': adminToken } : {};

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/photos?limit=100`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) setPhotos(data.photos);
    } catch { notifyErr('Failed to load gallery photos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this photo permanently?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/photos/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) { setPhotos(p => p.filter(x => x.id !== id)); success('Photo deleted'); }
      else notifyErr(data.message);
    } catch { notifyErr('Delete failed'); }
    finally { setDeletingId(null); }
  };

  const handleToggleFeatured = async (photo) => {
    setTogglingId(photo.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ featured: !photo.featured }),
      });
      const data = await res.json();
      if (data.success) {
        setPhotos(p => p.map(x => x.id === photo.id ? { ...x, featured: !x.featured } : x));
        success(photo.featured ? 'Removed from featured' : 'Added to featured');
      } else notifyErr(data.message);
    } catch { notifyErr('Update failed'); }
    finally { setTogglingId(null); }
  };

  const featuredCount = photos.filter(p => p.featured).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
    </div>
  );

  return (
    <div className="space-y-5">
      {showUpload && (
        <UploadModal
          adminToken={adminToken}
          onClose={() => setShowUpload(false)}
          onUploaded={(photo) => { setPhotos(p => [photo, ...p]); success('Photo uploaded!'); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="text-white font-bold text-lg">Gallery Photos</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {photos.length} photos · {featuredCount} featured
          </p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black"
          style={{ background: GOLD }}>
          <Plus className="w-4 h-4" /> Upload Photos
        </button>
      </div>

      {/* Info tip */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Photos uploaded here appear automatically on the public <span className="text-white font-medium">/gallery</span> page — no code changes needed. Star a photo to feature it at the top.
        </p>
      </div>

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Camera className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-bold mb-1">No photos yet</p>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Upload your first before & after to get started.</p>
          <button onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: GOLD }}>
            Upload First Photo
          </button>
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="rounded-2xl overflow-hidden relative group"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${photo.featured ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.07)'}` }}>

            {/* Before/after preview */}
            <div className="flex h-32">
              <img src={photo.beforeUrl} alt="Before" className="flex-1 object-cover" style={{ minWidth: 0 }} />
              {photo.afterUrl && (
                <>
                  <div className="w-0.5 flex-shrink-0" style={{ background: GOLD }} />
                  <img src={photo.afterUrl} alt="After" className="flex-1 object-cover" style={{ minWidth: 0 }} />
                </>
              )}
            </div>

            {/* Info */}
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                  style={{ background: 'rgba(201,168,76,0.1)', color: GOLD_S }}>{photo.serviceType}</span>
                {photo.featured && <Star className="w-3 h-3" style={{ color: GOLD_S }} />}
              </div>
              <p className="text-xs text-white truncate">{photo.vehicle}</p>
              {photo.caption && <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{photo.caption}</p>}
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.7)' }}>
              <button onClick={() => handleToggleFeatured(photo)} disabled={togglingId === photo.id}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: photo.featured ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)' }}
                title={photo.featured ? 'Remove from featured' : 'Add to featured'}>
                {togglingId === photo.id
                  ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                  : photo.featured
                    ? <StarOff className="w-4 h-4" style={{ color: GOLD_S }} />
                    : <Star className="w-4 h-4 text-white" />
                }
              </button>
              <button onClick={() => handleDelete(photo.id)} disabled={deletingId === photo.id}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.2)' }}>
                {deletingId === photo.id
                  ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  : <Trash2 className="w-4 h-4 text-red-400" />
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryManagement;