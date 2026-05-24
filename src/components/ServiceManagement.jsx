import React, { useState, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Settings, Package, ChevronUp, ChevronDown,
  Eye, EyeOff, Save, X, Check, AlertTriangle, Search, Filter,
  DollarSign, Tag, ArrowUpDown, Loader2, RefreshCw, Star
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const VEHICLE_TYPES     = ['Sedan', 'SUV', 'Truck', 'Coupe'];
const SERVICE_CATEGORIES = ['DETAILING', 'PROTECTION', 'RESTORATION', 'MAINTENANCE', 'SPECIALTY'];
const ADDON_CATEGORIES   = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];

const CATEGORY_COLORS = {
  DETAILING:   '#60a5fa', PROTECTION: '#c9a84c', RESTORATION: '#a78bfa',
  MAINTENANCE: '#34d399', SPECIALTY:  '#f97316', DEFAULT:     '#94a3b8',
  ENHANCEMENT: '#c9a84c', CLEANING:   '#60a5fa',
};

const api = async (path, options = {}) => {
  const res  = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
};

// ── Inline editable pricing cell ──────────────────────────────────────────
const PriceCell = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value ?? '');

  const commit = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-xs">$</span>
        <input
          autoFocus
          type="number" min="0" step="0.01"
          className="w-16 bg-transparent border-b text-yellow-300 text-sm font-bold outline-none"
          style={{ borderColor: 'rgba(201,168,76,0.5)' }}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        />
      </div>
    );
  }
  return (
    <button
      onClick={() => { setVal(value ?? ''); setEditing(true); }}
      className="text-sm font-bold transition-colors hover:text-yellow-400 group flex items-center gap-1"
      style={{ color: value > 0 ? '#f5d376' : '#6b7280' }}
      title="Click to edit"
    >
      {value > 0 ? `$${value}` : '—'}
      <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
};

// ── Confirm dialog ────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ background: 'rgba(0,0,0,0.8)' }}>
    <div className="rounded-2xl p-6 max-w-sm w-full"
      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-white text-sm leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-400 transition-colors hover:text-white"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2 rounded-xl text-sm font-bold text-black transition-all"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ── Service Form Modal ────────────────────────────────────────────────────
const ServiceFormModal = ({ onClose, onSubmit, initialData, saving }) => {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    name:        initialData?.name        ?? '',
    description: initialData?.description ?? '',
    category:    initialData?.category    ?? 'DETAILING',
    sortOrder:   initialData?.sortOrder   ?? 0,
    isActive:    initialData?.isActive    ?? true,
    pricing:     VEHICLE_TYPES.reduce((acc, t) => ({
      ...acc, [t]: initialData?.pricing?.[t] ?? ''
    }), {}),
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    VEHICLE_TYPES.forEach(t => {
      const v = parseFloat(form.pricing[t]);
      if (!form.pricing[t] || isNaN(v) || v <= 0) e[`price_${t}`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      name:      form.name.trim(),
      sortOrder: parseInt(form.sortOrder) || 0,
      pricing:   VEHICLE_TYPES.reduce((acc, t) => ({ ...acc, [t]: parseFloat(form.pricing[t]) }), {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#131313', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-white font-bold text-lg">
            {isEdit ? 'Edit Service' : 'New Service'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Service Name *</label>
            <input
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: errors.name ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
              }}
              placeholder="e.g. Full Interior Detail"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="Describe what's included..."
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Category + Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <select
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              >
                {SERVICE_CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sort Order</label>
              <input
                type="number" min="0"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={form.sortOrder}
                onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))}
              />
            </div>
          </div>

          {/* Pricing grid */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Pricing by Vehicle Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {VEHICLE_TYPES.map(t => (
                <div key={t} className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: errors[`price_${t}`] ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <div className="text-xs text-gray-500 mb-2 font-semibold">{t}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 font-bold">$</span>
                    <input
                      type="number" min="0" step="0.01"
                      className="flex-1 bg-transparent text-white font-bold text-lg outline-none"
                      placeholder="0.00"
                      value={form.pricing[t]}
                      onChange={e => {
                        setForm(p => ({ ...p, pricing: { ...p.pricing, [t]: e.target.value } }));
                        setErrors(p => ({ ...p, [`price_${t}`]: '' }));
                      }}
                    />
                  </div>
                  {errors[`price_${t}`] && <p className="text-red-400 text-xs mt-1">Required</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="text-white font-semibold text-sm">Visible to customers</div>
              <div className="text-gray-500 text-xs mt-0.5">Show this service on the website and booking form</div>
            </div>
            <button
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className="w-12 h-6 rounded-full transition-all duration-300 flex items-center relative"
              style={{ background: form.isActive ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.1)' }}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md absolute transition-all duration-300"
                style={{ left: form.isActive ? '26px' : '2px' }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'} Service</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Add-on Form Modal ─────────────────────────────────────────────────────
const AddOnFormModal = ({ onClose, onSubmit, initialData, saving }) => {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    name:        initialData?.name        ?? '',
    description: initialData?.description ?? '',
    category:    initialData?.category    ?? 'ENHANCEMENT',
    price:       initialData?.price       ?? '',
    sortOrder:   initialData?.sortOrder   ?? 0,
    isActive:    initialData?.isActive    ?? true,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    const p = parseFloat(form.price);
    if (!form.price || isNaN(p) || p <= 0) e.price = 'Must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, name: form.name.trim(), price: parseFloat(form.price), sortOrder: parseInt(form.sortOrder) || 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl"
        style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-white font-bold text-lg">{isEdit ? 'Edit Add-on' : 'New Add-on'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name *</label>
            <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: errors.name ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)' }}
              placeholder="e.g. Odour Elimination"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
            <textarea className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              rows={2} placeholder="Short description..." value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <select className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {ADDON_CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price *</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: errors.price ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-yellow-500 font-bold">$</span>
                <input type="number" min="0" step="0.01" className="flex-1 bg-transparent text-white font-bold outline-none"
                  placeholder="0.00" value={form.price}
                  onChange={e => { setForm(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: '' })); }} />
              </div>
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-white font-semibold text-sm">Visible to customers</div>
            <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className="w-12 h-6 rounded-full transition-all duration-300 relative"
              style={{ background: form.isActive ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.1)' }}>
              <div className="w-5 h-5 rounded-full bg-white shadow-md absolute transition-all duration-300"
                style={{ left: form.isActive ? '26px' : '2px', top: '2px' }} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? 'Update' : 'Create'} Add-on
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const ServiceManagement = ({ services, addOns, onRefresh }) => {
  const [tab, setTab]                 = useState('services');
  const [editService, setEditService] = useState(null);   // null | 'new' | service obj
  const [editAddon, setEditAddon]     = useState(null);   // null | 'new' | addon obj
  const [saving, setSaving]           = useState(false);
  const [confirm, setConfirm]         = useState(null);   // { message, onConfirm }
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('ALL');
  const [filterActive, setFilterActive] = useState('ALL'); // ALL | ACTIVE | INACTIVE
  const { success, error: notifyErr } = useNotifications();

  // ── API helpers ──
  const call = useCallback(async (fn) => {
    setSaving(true);
    try { await fn(); }
    finally { setSaving(false); }
  }, []);

  const saveService = async (data) => {
    await call(async () => {
      const res = editService === 'new'
        ? await api('/services', { method: 'POST', body: JSON.stringify(data) })
        : await api(`/services/${editService.id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res.success) { success(editService === 'new' ? 'Service created!' : 'Service updated!'); onRefresh(); setEditService(null); }
      else notifyErr(res.message || 'Failed');
    });
  };

  const toggleService = async (svc) => {
    const res = await api(`/services/${svc.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !svc.isActive }) });
    if (res.success) { success(svc.isActive ? 'Service hidden' : 'Service visible'); onRefresh(); }
    else notifyErr(res.message || 'Failed');
  };

  const deleteService = (svc) => setConfirm({
    message: `Deactivate "${svc.name}"? It will be hidden from customers.`,
    onConfirm: async () => {
      const res = await api(`/services/${svc.id}`, { method: 'DELETE' });
      if (res.success) { success('Service deactivated'); onRefresh(); }
      else notifyErr(res.message || 'Failed');
      setConfirm(null);
    },
  });

  const moveService = async (svc, dir) => {
    const res = await api(`/services/${svc.id}`, {
      method: 'PUT',
      body: JSON.stringify({ sortOrder: svc.sortOrder + dir }),
    });
    if (res.success) onRefresh();
  };

  const saveAddon = async (data) => {
    await call(async () => {
      const res = editAddon === 'new'
        ? await api('/services/addons', { method: 'POST', body: JSON.stringify(data) })
        : await api(`/services/addons/${editAddon.id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res.success) { success(editAddon === 'new' ? 'Add-on created!' : 'Add-on updated!'); onRefresh(); setEditAddon(null); }
      else notifyErr(res.message || 'Failed');
    });
  };

  const toggleAddon = async (addon) => {
    const res = await api(`/services/addons/${addon.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !addon.isActive }) });
    if (res.success) { success(addon.isActive ? 'Add-on hidden' : 'Add-on visible'); onRefresh(); }
    else notifyErr(res.message || 'Failed');
  };

  const deleteAddon = (addon) => setConfirm({
    message: `Deactivate "${addon.name}"?`,
    onConfirm: async () => {
      const res = await api(`/services/addons/${addon.id}`, { method: 'DELETE' });
      if (res.success) { success('Add-on deactivated'); onRefresh(); }
      else notifyErr(res.message || 'Failed');
      setConfirm(null);
    },
  });

  // Inline price update
  const updatePrice = async (serviceId, vehicleType, newPrice) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    const newPricing = { ...svc.pricing, [vehicleType]: newPrice };
    const res = await api(`/services/${serviceId}`, { method: 'PUT', body: JSON.stringify({ pricing: newPricing }) });
    if (res.success) { success(`${vehicleType} price updated`); onRefresh(); }
    else notifyErr('Failed to update price');
  };

  // ── Filters ──
  const categories = ['ALL', ...SERVICE_CATEGORIES];
  const filteredServices = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === 'ALL' || s.category === filterCat;
    const matchActive = filterActive === 'ALL' || (filterActive === 'ACTIVE' ? s.isActive : !s.isActive);
    return matchSearch && matchCat && matchActive;
  });

  const filteredAddons = addOns.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ──
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-white font-bold text-xl">Service & Pricing Manager</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {services.length} services · {addOns.length} add-ons · All changes go live instantly
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            {tab === 'services' ? (
              <button onClick={() => setEditService('new')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}>
                <Plus className="w-4 h-4" /> Add Service
              </button>
            ) : (
              <button onClick={() => setEditAddon('new')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                <Plus className="w-4 h-4" /> Add Add-on
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'services', label: `Services (${services.length})`, icon: Settings },
            { id: 'addons',   label: `Add-ons (${addOns.length})`,   icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); setSearch(''); }}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px"
              style={{
                borderColor: tab === id ? '#f5d376' : 'transparent',
                color: tab === id ? '#f5d376' : '#6b7280',
              }}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-600"
              placeholder={tab === 'services' ? 'Search services...' : 'Search add-ons...'}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === 'services' && (
            <>
              <select
                className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                {categories.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c === 'ALL' ? 'All Categories' : c}</option>)}
              </select>
              <select
                className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                value={filterActive} onChange={e => setFilterActive(e.target.value)}>
                {[['ALL','All Status'],['ACTIVE','Active Only'],['INACTIVE','Inactive']].map(([v,l]) => (
                  <option key={v} value={v} style={{ background: '#1a1a1a' }}>{l}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* ── SERVICES LIST ── */}
      {tab === 'services' && (
        <div className="space-y-2">
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 text-gray-600">No services match your filters.</div>
          ) : filteredServices
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(svc => {
                const catColor = CATEGORY_COLORS[svc.category] || CATEGORY_COLORS.DEFAULT;
                return (
                  <div key={svc.id} className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${svc.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)'}`,
                      opacity: svc.isActive ? 1 : 0.6,
                    }}>

                    {/* Service header row */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      {/* Sort arrows */}
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveService(svc, -1)} className="text-gray-600 hover:text-gray-300 transition-colors">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveService(svc, 1)} className="text-gray-600 hover:text-gray-300 transition-colors">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Category dot */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor }} />

                      {/* Name + badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm">{svc.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${catColor}18`, color: catColor }}>
                            {svc.category}
                          </span>
                          {!svc.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 font-semibold">
                              Hidden
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}>
                            #{svc.sortOrder}
                          </span>
                        </div>
                        {svc.description && (
                          <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{svc.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => toggleService(svc)} title={svc.isActive ? 'Hide service' : 'Show service'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
                          {svc.isActive
                            ? <Eye className="w-4 h-4 text-green-400" />
                            : <EyeOff className="w-4 h-4 text-gray-600" />}
                        </button>
                        <button onClick={() => setEditService(svc)} title="Edit service"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
                          <Edit3 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button onClick={() => deleteService(svc)} title="Deactivate"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Inline pricing grid */}
                    <div className="grid grid-cols-4 divide-x px-5 py-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)', }}>
                      {VEHICLE_TYPES.map(vt => (
                        <div key={vt} className="px-3 first:pl-0 last:pr-0">
                          <div className="text-gray-600 text-xs mb-1">{vt}</div>
                          <PriceCell
                            value={svc.pricing?.[vt]}
                            onSave={(val) => updatePrice(svc.id, vt, val)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* ── ADD-ONS LIST ── */}
      {tab === 'addons' && (
        <div className="space-y-2">
          {filteredAddons.length === 0 ? (
            <div className="text-center py-16 text-gray-600">No add-ons found.</div>
          ) : filteredAddons
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(addon => {
                const catColor = CATEGORY_COLORS[addon.category] || CATEGORY_COLORS.DEFAULT;
                return (
                  <div key={addon.id}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      opacity: addon.isActive ? 1 : 0.5,
                    }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">{addon.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${catColor}18`, color: catColor }}>
                          {addon.category}
                        </span>
                        {!addon.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Hidden</span>
                        )}
                      </div>
                      {addon.description && (
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{addon.description}</p>
                      )}
                    </div>

                    <div className="text-lg font-black flex-shrink-0" style={{
                      background: 'linear-gradient(135deg, #34d399, #6ee7b7)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                      +${addon.price}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleAddon(addon)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                        {addon.isActive ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
                      </button>
                      <button onClick={() => setEditAddon(addon)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Edit3 className="w-4 h-4 text-blue-400" />
                      </button>
                      <button onClick={() => deleteAddon(addon)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* Modals */}
      {editService && (
        <ServiceFormModal
          initialData={editService === 'new' ? null : editService}
          onClose={() => setEditService(null)}
          onSubmit={saveService}
          saving={saving}
        />
      )}
      {editAddon && (
        <AddOnFormModal
          initialData={editAddon === 'new' ? null : editAddon}
          onClose={() => setEditAddon(null)}
          onSubmit={saveAddon}
          saving={saving}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
