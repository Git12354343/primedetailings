// src/components/admin/FAQManager.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, CheckCircle, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

const API   = import.meta.env.VITE_API_URL;
const GOLD  = 'linear-gradient(135deg, #00a8cc, #00d4ff)';

const iBase = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: '#fff',
  padding: '9px 13px', fontSize: '14px',
  outline: 'none', width: '100%',
};

const FAQManager = ({ adminToken }) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch(`${API}/faq`, { headers: { 'X-Admin-Secret': adminToken || '' } })
      .then(r => r.json())
      .then(d => { if (d.success) setItems(d.items || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res  = await fetch(`${API}/faq`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminToken || '' },
        body:    JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to save');
      setItems(data.items);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems(p => [...p, { id: Date.now(), q: '', a: '' }]);
  };

  const update = (id, field, val) => {
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const remove = (id) => {
    setItems(p => p.filter(i => i.id !== id));
  };

  const moveUp   = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; setItems(a); };
  const moveDown = (idx) => { if (idx === items.length-1) return; const a=[...items]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; setItems(a); };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00a8cc' }} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">FAQ Manager</h2>
          <p className="text-gray-500 text-sm mt-0.5">Edit the Common Questions section on the website</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50"
          style={{ background: saved ? 'linear-gradient(135deg,#34d399,#10b981)' : GOLD }}>
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle className="w-4 h-4" /> Saved!</>
            : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm p-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      {/* FAQ items */}
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No questions yet. Add one below.</p>
        )}
        {items.map((item, idx) => (
          <div key={item.id} className="rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Row header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 w-5">#{idx + 1}</span>
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="disabled:opacity-20 text-gray-500 hover:text-white transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1}
                  className="disabled:opacity-20 text-gray-500 hover:text-white transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => remove(item.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                style={{ color: '#f87171' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Question */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Question</label>
              <input
                style={iBase}
                value={item.q}
                placeholder="e.g. Do you come to my location?"
                onChange={e => update(item.id, 'q', e.target.value)}
              />
            </div>

            {/* Answer */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Answer</label>
              <textarea
                style={{ ...iBase, resize: 'vertical', minHeight: '80px' }}
                value={item.a}
                placeholder="Write the answer here…"
                onChange={e => update(item.id, 'a', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold w-full justify-center"
        style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)', color: '#00a8cc' }}>
        <Plus className="w-4 h-4" /> Add Question
      </button>

      {/* Bottom save */}
      {items.length > 3 && (
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-black disabled:opacity-50"
          style={{ background: GOLD }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save All Changes</>}
        </button>
      )}
    </div>
  );
};

export default FAQManager;
