// src/components/admin/TrainingManager.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Eye, EyeOff, Trash2, Edit2, Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD_S  = '#00a8cc';

const CATEGORIES = ['GENERAL','SERVICE_PROCEDURE','PRODUCT_USAGE','SAFETY','CERAMIC_COATING','CUSTOMER_COMMUNICATION','PHOTO_STANDARDS','JOB_WORKFLOW'];
const LEVELS     = ['BEGINNER','INTERMEDIATE','ADVANCED'];

const emptyForm = {
  title:'', titleFr:'', description:'', descriptionFr:'',
  content:'', contentFr:'', category:'GENERAL', level:'BEGINNER',
  isRequired: false, estimatedMinutes: '', sortOrder: 0,
};

const TrainingManager = ({ adminToken }) => {
  const [modules,  setModules]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState(null); // moduleId
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(null);

  const headers = { 'X-Admin-Secret': adminToken, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/training/admin/modules`, { headers });
      const data = await res.json();
      if (data.success) setModules(data.modules);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title || !form.content) return alert('Title and content are required.');
    setSaving(true);
    try {
      const url    = editing ? `${API_URL}/training/admin/modules/${editing}` : `${API_URL}/training/admin/modules`;
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers, body: JSON.stringify({ ...form, estimatedMinutes: parseInt(form.estimatedMinutes) || null }) });
      const data   = await res.json();
      if (data.success) { await load(); setCreating(false); setEditing(null); setForm(emptyForm); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const togglePublish = async (id, current) => {
    try {
      await fetch(`${API_URL}/training/admin/modules/${id}/publish`, {
        method: 'PATCH', headers, body: JSON.stringify({ isPublished: !current }),
      });
      setModules(prev => prev.map(m => m.id === id ? { ...m, isPublished: !current } : m));
    } catch {}
  };

  const deleteModule = async (id) => {
    if (!confirm('Delete this module? This cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/training/admin/modules/${id}`, { method: 'DELETE', headers });
      setModules(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const startEdit = (m) => {
    setForm({ ...emptyForm, ...m, estimatedMinutes: m.estimatedMinutes || '' });
    setEditing(m.id);
    setCreating(true);
  };

  const InputField = ({ label, field, ...props }) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>{label}</label>
      <input value={form[field]} onChange={e => set(field, e.target.value)} {...props}
        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Training Modules</h2>
          <p className="text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>{modules.length} modules</p>
        </div>
        {!creating && (
          <button onClick={() => { setForm(emptyForm); setEditing(null); setCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background:`linear-gradient(135deg,#00a8cc,#00d4ff)`, color:'#0b0f1a' }}>
            <Plus className="w-4 h-4" /> New Module
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      {creating && (
        <div className="rounded-2xl p-5 mb-6"
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(0,168,204,0.2)' }}>
          <h3 className="text-white font-bold text-base mb-4">{editing ? 'Edit Module' : 'New Training Module'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InputField label="Title (EN) *" field="title" placeholder="Ceramic Coating Application" />
            <InputField label="Title (FR)" field="titleFr" placeholder="Application de revêtement céramique" />
            <InputField label="Description (EN)" field="description" placeholder="Short description..." />
            <InputField label="Description (FR)" field="descriptionFr" placeholder="Courte description..." />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <InputField label="Est. Minutes" field="estimatedMinutes" type="number" placeholder="20" />
            <InputField label="Sort Order" field="sortOrder" type="number" placeholder="0" />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>Content (EN) — Markdown *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={8}
              placeholder="# Title&#10;&#10;## Step 1&#10;- Item A&#10;- Item B&#10;&#10;**Important:** ..."
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-y font-mono"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>Content (FR) — Markdown</label>
            <textarea value={form.contentFr} onChange={e => set('contentFr', e.target.value)} rows={5}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-y font-mono"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRequired} onChange={e => set('isRequired', e.target.checked)} />
              <span className="text-sm text-white">Required module</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setCreating(false); setEditing(null); setForm(emptyForm); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background:`linear-gradient(135deg,#00a8cc,#00d4ff)`, color:'#0b0f1a' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map(m => (
            <div key={m.id} className="rounded-2xl overflow-hidden"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{m.title}</p>
                  <p className="text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>
                    {m.category.replace(/_/g,' ')} · {m.level}
                    {m.isRequired && <span style={{ color: GOLD_S }}> · Required</span>}
                    {` · ${m._count?.progress || 0} completions`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: m.isPublished ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)',
                      color: m.isPublished ? '#34d399' : 'rgba(255,255,255,0.4)',
                    }}>
                    {m.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <button onClick={() => togglePublish(m.id, m.isPublished)} title={m.isPublished ? 'Unpublish' : 'Publish'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background:'rgba(255,255,255,0.05)' }}>
                    {m.isPublished ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5" style={{ color: GOLD_S }} />}
                  </button>
                  <button onClick={() => startEdit(m)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background:'rgba(255,255,255,0.05)' }}>
                    <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => deleteModule(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background:'rgba(239,68,68,0.08)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingManager;
