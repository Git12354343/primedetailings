import React, { useState, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Eye, EyeOff, Star, Sparkles,
  X, Check, AlertTriangle, Loader2, RefreshCw, Clock,
  DollarSign, Package
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck'];



// ── Confirm dialog ─────────────────────────────────────────────────────────
const ConfirmDialog = ({ msg, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ background: 'rgba(0,0,0,0.85)' }}>
    <div className="rounded-2xl p-6 max-w-sm w-full"
      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
        <p className="text-white text-sm leading-relaxed">{msg}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2 rounded-xl text-sm font-bold text-black"
          style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ── Shared helpers (must be outside components to avoid remount on re-render) ──
const F = ({ label, err, children }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</label>}
    {children}
    {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
  </div>
);

const inputCls = (err) => ({
  display: 'block', width: '100%', padding: '10px 14px',
  borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#fff',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
});

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-xl"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <span className="text-white text-sm">{label}</span>
    <button onClick={() => onChange(!value)}
      className="w-11 h-6 rounded-full relative transition-all duration-300"
      style={{ background: value ? 'rgba(0,168,204,0.8)' : 'rgba(255,255,255,0.1)' }}>
      <div className="w-5 h-5 rounded-full bg-[#111827] shadow absolute top-0.5 transition-all duration-300"
        style={{ left: value ? '24px' : '2px' }} />
    </button>
  </div>
);

// ── Package Form Modal ─────────────────────────────────────────────────────
const PackageFormModal = ({ initial, services, addOns, onClose, onSubmit, saving }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:              initial?.name              ?? '',
    description:       initial?.description       ?? '',
    tagline:           initial?.tagline           ?? '',
    imageUrl:          initial?.imageUrl          ?? '',
    includedServices:  initial?.includedServices  ?? [],
    includedAddOns:    initial?.includedAddOns    ?? [],
    pricing:           VEHICLE_TYPES.reduce((a, t) => ({ ...a, [t]: initial?.pricing?.[t] ?? '' }), {}),
    estimatedDuration: initial?.estimatedDuration ?? '',
    isActive:          initial?.isActive          ?? true,
    isFeatured:        initial?.isFeatured        ?? false,
    isMostPopular:     initial?.isMostPopular      ?? false,
    requiresQuote:     initial?.requiresQuote      ?? false,
    sortOrder:         initial?.sortOrder          ?? 0,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = () => {
    if (!validate()) return;
    const pricing = {};
    VEHICLE_TYPES.forEach(t => {
      const v = parseFloat(form.pricing[t]);
      if (!isNaN(v) && v > 0) pricing[t] = v;
    });
    onSubmit({
      ...form,
      name:              form.name.trim(),
      description:       form.description.trim() || null,
      tagline:           form.tagline.trim()      || null,
      imageUrl:          form.imageUrl.trim()     || null,
      pricing,
      estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : null,
      sortOrder:         parseInt(form.sortOrder) || 0,
    });
  };

  const toggleSvc   = (id) => setForm(p => ({
    ...p, includedServices: p.includedServices.includes(id)
      ? p.includedServices.filter(x => x !== id) : [...p.includedServices, id],
  }));
  const toggleAddon = (id) => setForm(p => ({
    ...p, includedAddOns: p.includedAddOns.includes(id)
      ? p.includedAddOns.filter(x => x !== id) : [...p.includedAddOns, id],
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl custom-scrollbar"
        style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#131313', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-white font-bold text-lg">{isEdit ? 'Edit Package' : 'New Package'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <F label="Package Name *" err={errors.name}>
            <input style={inputCls(errors.name)} value={form.name} placeholder="e.g. Premium Detail"
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }} />
          </F>
          <F label="Description">
            <textarea style={{ ...inputCls(false), resize: 'none' }} rows={3} value={form.description}
              placeholder="What's included, who it's for..."
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Tagline">
              <input style={inputCls(false)} value={form.tagline} placeholder="Best for maintenance"
                onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} />
            </F>
            <F label="Duration (minutes)">
              <input style={inputCls(false)} type="number" min="0" value={form.estimatedDuration}
                placeholder="e.g. 240"
                onChange={e => setForm(p => ({ ...p, estimatedDuration: e.target.value }))} />
            </F>
          </div>

          {/* Pricing */}
          <F label="Pricing by Vehicle">
            <div className="grid grid-cols-2 gap-3">
              {VEHICLE_TYPES.map(t => (
                <div key={t} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs text-gray-500 mb-1.5">{t}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-500 font-bold text-sm">$</span>
                    <input type="number" min="0" step="0.01"
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, width: '100%' }}
                      placeholder="0"
                      value={form.pricing[t]}
                      onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, [t]: e.target.value } }))} />
                  </div>
                </div>
              ))}
            </div>
          </F>

          {/* Services */}
          {services.length > 0 && (
            <F label="Included Services">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map(s => {
                  const sel = form.includedServices.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)}
                      className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: sel ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.03)',
                        border: sel ? '1px solid rgba(0,168,204,0.35)' : '1px solid rgba(255,255,255,0.07)',
                      }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: sel ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'rgba(255,255,255,0.1)', color: '#000' }}>
                        {sel && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm" style={{ color: sel ? '#00d4ff' : '#9ca3af' }}>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </F>
          )}

          {/* Add-ons */}
          {addOns.length > 0 && (
            <F label="Included Add-Ons">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {addOns.map(a => {
                  const sel = form.includedAddOns.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggleAddon(a.id)}
                      className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: sel ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                        border: sel ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: sel ? '#34d399' : 'rgba(255,255,255,0.1)', color: '#000' }}>
                        {sel && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm" style={{ color: sel ? '#6ee7b7' : '#9ca3af' }}>{a.name} +${a.price}</span>
                    </button>
                  );
                })}
              </div>
            </F>
          )}

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle label="Visible to customers"  value={form.isActive}      onChange={v => setForm(p => ({ ...p, isActive: v }))} />
            <Toggle label="Most Popular badge"     value={form.isMostPopular} onChange={v => setForm(p => ({ ...p, isMostPopular: v }))} />
            <Toggle label="Featured"               value={form.isFeatured}    onChange={v => setForm(p => ({ ...p, isFeatured: v }))} />
            <Toggle label="Requires Custom Quote"  value={form.requiresQuote} onChange={v => setForm(p => ({ ...p, requiresQuote: v }))} />
          </div>

          <F label="Image URL">
            <input style={inputCls(false)} value={form.imageUrl} placeholder="https://..."
              onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
          </F>

          <F label="Sort Order">
            <input style={inputCls(false)} type="number" min="0" value={form.sortOrder}
              onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} />
          </F>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Check className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'} Package</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const PackageManagement = ({ packages, services, addOns, onRefresh, adminToken }) => {
  // Build authFetch from adminToken
  const authFetch = (url, opts = {}) => fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': adminToken || '',
      ...(opts.headers || {}),
    },
  });
  const [editPkg, setEditPkg] = useState(null); // null | 'new' | pkg
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);
  const { success, error: notifyErr } = useNotifications();

  const save = useCallback(async (data) => {
    setSaving(true);
    try {
      const url = editPkg === 'new'
        ? `${import.meta.env.VITE_API_URL}/packages`
        : `${import.meta.env.VITE_API_URL}/packages/${editPkg.id}`;
      const res = await authFetch(url, {
        method: editPkg === 'new' ? 'POST' : 'PUT',
        body: JSON.stringify(data),
      });
      if (res.success) {
        success(editPkg === 'new' ? 'Package created!' : 'Package updated!');
        onRefresh(); setEditPkg(null);
      } else notifyErr(res.message || 'Failed');
    } catch { notifyErr('Network error'); }
    finally { setSaving(false); }
  }, [editPkg, onRefresh, authFetch]);

  const toggle = async (pkg) => {
    const res = await authFetch(`${import.meta.env.VITE_API_URL}/packages/${pkg.id}`, {
      method: 'PUT', body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    if (res.success) { success(pkg.isActive ? 'Package hidden' : 'Package visible'); onRefresh(); }
    else notifyErr(res.message || 'Failed');
  };

  const del = (pkg) => setConfirm({
    msg: `Deactivate "${pkg.name}"?`,
    onConfirm: async () => {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/packages/${pkg.id}`, { method: 'DELETE' });
      if (res.success) { success('Package deactivated'); onRefresh(); }
      else notifyErr(res.message || 'Failed');
      setConfirm(null);
    },
  });

  const getMinP = (p) => {
    const v = Object.values(p || {}).filter(x => x > 0);
    return v.length ? Math.min(...v) : null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="text-white font-bold text-lg">Package Manager</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {(packages || []).length} packages · Shown on homepage, services page & booking form
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setEditPkg('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            <Plus className="w-4 h-4" /> Add Package
          </button>
        </div>
      </div>

      {/* Empty */}
      {(packages || []).length === 0 && (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No packages yet.</p>
          <button onClick={() => setEditPkg('new')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            Create First Package
          </button>
        </div>
      )}

      {/* Package list */}
      <div className="space-y-3">
        {[...(packages || [])].sort((a, b) => a.sortOrder - b.sortOrder).map(pkg => {
          const min = getMinP(pkg.pricing);
          return (
            <div key={pkg.id} className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${pkg.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)'}`,
                opacity: pkg.isActive ? 1 : 0.6,
              }}>
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Badges */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {pkg.isMostPopular && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,168,204,0.15)', color: '#00d4ff' }}>
                      <Star className="w-3 h-3" />
                    </span>
                  )}
                  {pkg.isFeatured && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>★</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm">{pkg.name}</span>
                    {!pkg.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Hidden</span>
                    )}
                    {pkg.requiresQuote && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(96,165,250,0.1)', color: '#93c5fd' }}>Custom Quote</span>
                    )}
                  </div>
                  {pkg.tagline && <p className="text-gray-500 text-xs mt-0.5 italic">{pkg.tagline}</p>}
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {min && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#00a8cc' }}>
                        <DollarSign className="w-3 h-3" /> From ${min}
                      </span>
                    )}
                    {pkg.estimatedDuration && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {Math.floor(pkg.estimatedDuration / 60)}h {pkg.estimatedDuration % 60 > 0 ? `${pkg.estimatedDuration % 60}m` : ''}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {(pkg.includedServices || []).length} services · {(pkg.includedAddOns || []).length} add-ons
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggle(pkg)} title={pkg.isActive ? 'Hide' : 'Show'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                    {pkg.isActive ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
                  </button>
                  <button onClick={() => setEditPkg(pkg)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                  </button>
                  <button onClick={() => del(pkg)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Pricing strip */}
              <div className="grid grid-cols-4 divide-x px-5 py-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                {VEHICLE_TYPES.map(vt => (
                  <div key={vt} className="px-3 first:pl-0 last:pr-0">
                    <div className="text-gray-600 text-xs">{vt}</div>
                    <div className="text-sm font-bold mt-0.5" style={{
                      background: pkg.pricing?.[vt] ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'none',
                      WebkitBackgroundClip: pkg.pricing?.[vt] ? 'text' : 'unset',
                      WebkitTextFillColor: pkg.pricing?.[vt] ? 'transparent' : '#4b5563',
                      backgroundClip: pkg.pricing?.[vt] ? 'text' : 'unset',
                    }}>
                      {pkg.pricing?.[vt] ? `$${pkg.pricing[vt]}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editPkg && (
        <PackageFormModal
          initial={editPkg === 'new' ? null : editPkg}
          services={services} addOns={addOns}
          onClose={() => setEditPkg(null)}
          onSubmit={save} saving={saving}
        />
      )}
      {confirm && <ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

export default PackageManagement;
