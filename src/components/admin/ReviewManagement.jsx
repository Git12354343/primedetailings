// src/components/admin/ReviewManagement.jsx
// Admin CRUD for the (editable, curated) reviews shown on the public site.
// Talks to:
//   GET    /api/reviews            -> { success, reviews: [...] }
//   POST   /api/reviews            -> create
//   PUT    /api/reviews/:id        -> update
//   DELETE /api/reviews/:id        -> delete
// If the backend isn't wired yet, it shows a clear notice and lets you draft
// locally so the UI is fully testable now (your dev can connect the routes).
import React, { useEffect, useState } from 'react';
import { Star, Plus, Trash2, Edit2, Save, X, Loader2, GripVertical, Eye, EyeOff } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('adminToken') || localStorage.getItem('detailerToken');

const EMPTY = { name: '', rating: 5, vehicle: '', text: '', source: 'Google', isActive: true, sortOrder: 0 };

const authHeaders = () => ({ 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}>
        <Star className="w-5 h-5" style={{ color: n <= value ? '#f5d376' : '#3f3f46', fill: n <= value ? '#f5d376' : 'none' }} />
      </button>
    ))}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

const ReviewForm = ({ initial, onSave, onCancel, saving }) => {
  const [v, setV] = useState(initial);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));

  return (
    <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)' }}>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Field label="Customer name"><input className={inputCls} style={inputStyle} value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="Marc-André L." /></Field>
        <Field label="Vehicle (optional)"><input className={inputCls} style={inputStyle} value={v.vehicle} onChange={(e) => set('vehicle', e.target.value)} placeholder="BMW M4" /></Field>
      </div>
      <Field label="Review text">
        <textarea className={inputCls} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={v.text} onChange={(e) => set('text', e.target.value)} placeholder="The ceramic coating is unreal…" />
      </Field>
      <div className="grid sm:grid-cols-3 gap-4 mt-4 items-end">
        <Field label="Rating"><StarPicker value={v.rating} onChange={(n) => set('rating', n)} /></Field>
        <Field label="Source">
          <select className={inputCls} style={inputStyle} value={v.source} onChange={(e) => set('source', e.target.value)}>
            <option>Google</option><option>Facebook</option><option>Instagram</option><option>Direct</option>
          </select>
        </Field>
        <Field label="Sort order"><input type="number" className={inputCls} style={inputStyle} value={v.sortOrder} onChange={(e) => set('sortOrder', parseInt(e.target.value) || 0)} /></Field>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <button onClick={() => onSave(v)} disabled={saving || !v.name || !v.text}
          className="btn-luxury inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save review
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
};

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reviews`, { headers: authHeaders() });
      const d = await res.json();
      if (d?.success) { setReviews(d.reviews || []); setOffline(false); }
      else setOffline(true);
    } catch { setOffline(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (data) => {
    setSaving(true);
    try {
      if (offline) { setReviews((p) => [...p, { ...data, id: `local-${Date.now()}` }]); }
      else {
        const res = await fetch(`${API}/reviews`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
        const d = await res.json();
        if (d?.success) await load();
      }
      setAdding(false);
    } finally { setSaving(false); }
  };

  const update = async (id, data) => {
    setSaving(true);
    try {
      if (offline || String(id).startsWith('local-')) { setReviews((p) => p.map((r) => (r.id === id ? { ...r, ...data } : r))); }
      else {
        const res = await fetch(`${API}/reviews/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
        const d = await res.json();
        if (d?.success) await load();
      }
      setEditId(null);
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    if (offline || String(id).startsWith('local-')) { setReviews((p) => p.filter((r) => r.id !== id)); return; }
    const res = await fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: authHeaders() });
    const d = await res.json();
    if (d?.success) await load();
  };

  const toggleActive = (r) => update(r.id, { ...r, isActive: !r.isActive });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Reviews</h2>
          <p className="text-gray-500 text-sm">Curated reviews shown on your website.</p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-luxury inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold">
            <Plus className="w-4 h-4" /> Add review
          </button>
        )}
      </div>

      {offline && (
        <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          Reviews API not detected — you can draft reviews here, but they won't persist until the backend <code>/api/reviews</code> routes are connected. (Drafts are kept only for this session.)
        </div>
      )}

      {adding && <ReviewForm initial={EMPTY} onSave={create} onCancel={() => setAdding(false)} saving={saving} />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-yellow-500" /></div>
      ) : reviews.length === 0 && !adding ? (
        <div className="text-center py-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Star className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No reviews yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) =>
            editId === r.id ? (
              <ReviewForm key={r.id} initial={r} onSave={(data) => update(r.id, data)} onCancel={() => setEditId(null)} saving={saving} />
            ) : (
              <div key={r.id} className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', opacity: r.isActive === false ? 0.5 : 1 }}>
                <GripVertical className="w-4 h-4 text-gray-700 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-bold text-sm">{r.name}</span>
                    {r.vehicle && <span className="text-gray-500 text-xs">· {r.vehicle}</span>}
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3" style={{ color: i < r.rating ? '#f5d376' : '#3f3f46', fill: i < r.rating ? '#f5d376' : 'none' }} />)}</div>
                    {r.source && <span className="text-gray-600 text-[10px] uppercase tracking-wider">via {r.source}</span>}
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">"{r.text}"</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(r)} aria-label="Toggle visibility" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {r.isActive === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditId(r.id)} aria-label="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(r.id)} aria-label="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
