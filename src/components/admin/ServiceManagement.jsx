import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Settings, Package, Layers, X, Check, Loader2 } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import PackageManagement from './PackageManagement';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';

const inputCls = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: '#fff', padding: '10px 14px', fontSize: '13px', outline: 'none',
  fontFamily: 'inherit',
};
const labelCls = {
  display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'rgba(0,168,204,0.8)', marginBottom: '6px',
};

// ── Dark modal wrapper ─────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
    <div className={`w-full rounded-2xl overflow-hidden ${wide ? 'max-w-2xl' : 'max-w-md'}`}
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="font-bold text-white">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

// ── Service form ───────────────────────────────────────────────────────────────
const ServiceFormModal = ({ isOpen, onClose, onSubmit, vehicleTypes, serviceCategories, title, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    nameFr: initialData?.nameFr || '',
    description: initialData?.description || '',
    descriptionFr: initialData?.descriptionFr || '',
    category: initialData?.category || 'DETAILING',
    pricing: initialData?.pricing || vehicleTypes.reduce((a, t) => ({ ...a, [t]: '' }), {}),
    isActive: initialData?.isActive ?? true,
    requiresQuote: initialData?.requiresQuote ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  };

  if (!isOpen) return null;
  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label style={labelCls}>Service Name (EN) *</label>
          <input style={inputCls} value={formData.name} required
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelCls}>Service Name (FR) <span style={{color:'rgba(255,255,255,0.35)',fontWeight:400}}>— optionnel</span></label>
          <input style={inputCls} value={formData.nameFr || ''}
            onChange={e => setFormData(p => ({ ...p, nameFr: e.target.value }))}
            placeholder="ex. Nettoyage intérieur complet"
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelCls}>Description (EN)</label>
          <textarea style={{ ...inputCls, resize: 'vertical', minHeight: '80px' }} rows={3}
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelCls}>Description (FR) <span style={{color:'rgba(255,255,255,0.35)',fontWeight:400}}>— optionnel</span></label>
          <textarea style={{ ...inputCls, resize: 'vertical', minHeight: '80px' }} rows={3}
            value={formData.descriptionFr || ''}
            onChange={e => setFormData(p => ({ ...p, descriptionFr: e.target.value }))}
            placeholder="ex. Description du service en français..."
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelCls}>Category</label>
          <select style={{ ...inputCls, cursor: 'pointer' }} value={formData.category}
            onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
            {serviceCategories.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelCls}>Pricing by Vehicle</label>
          <div className="grid grid-cols-2 gap-3">
            {vehicleTypes.map(type => (
              <div key={type}>
                <label style={{ ...labelCls, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{type}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                  <input style={{ ...inputCls, paddingLeft: '24px' }} type="number" step="0.01" placeholder="0.00"
                    value={formData.pricing[type] || ''}
                    onChange={e => setFormData(p => ({ ...p, pricing: { ...p.pricing, [type]: e.target.value } }))}
                    onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
            className="w-9 h-5 rounded-full relative transition-colors"
            style={{ background: formData.isActive ? GOLD_S : 'rgba(255,255,255,0.15)' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-[#111827] shadow transition-transform"
              style={{ transform: formData.isActive ? 'translateX(16px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm text-white">Active (visible to customers)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setFormData(p => ({ ...p, requiresQuote: !p.requiresQuote }))}
            className="w-9 h-5 rounded-full relative transition-colors"
            style={{ background: formData.requiresQuote ? '#f59e0b' : 'rgba(255,255,255,0.15)' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-[#111827] shadow transition-transform"
              style={{ transform: formData.requiresQuote ? 'translateX(16px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm text-white">Requires Custom Quote <span className="text-amber-400 text-xs">(bypasses booking, goes to quote form)</span></span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: GOLD }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {initialData ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Add-on form ────────────────────────────────────────────────────────────────
const AddOnFormModal = ({ isOpen, onClose, onSubmit, addOnCategories, title, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '', nameFr: initialData?.nameFr || '',
    description: initialData?.description || '', descriptionFr: initialData?.descriptionFr || '',
    category: initialData?.category || 'ENHANCEMENT', price: initialData?.price || '',
    sortOrder: initialData?.sortOrder || 0, isActive: initialData?.isActive ?? true,
    requiresQuote: initialData?.requiresQuote ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  };

  if (!isOpen) return null;
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label style={labelCls}>Add-on Name (EN) *</label>
          <input style={inputCls} value={formData.name} required
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelCls}>Description</label>
          <textarea style={{ ...inputCls, resize: 'vertical' }} rows={2}
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelCls}>Category</label>
          <select style={{ ...inputCls, cursor: 'pointer' }} value={formData.category}
            onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
            {addOnCategories.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelCls}>Price *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
            <input style={{ ...inputCls, paddingLeft: '24px' }} type="number" step="0.01" required
              value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
              onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
        </div>
        <div>
          <label style={labelCls}>Sort Order</label>
          <input style={inputCls} type="number" value={formData.sortOrder}
            onChange={e => setFormData(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
            onFocus={e => e.target.style.borderColor = GOLD_S} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
            className="w-9 h-5 rounded-full relative transition-colors"
            style={{ background: formData.isActive ? GOLD_S : 'rgba(255,255,255,0.15)' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-[#111827] shadow transition-transform"
              style={{ transform: formData.isActive ? 'translateX(16px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm text-white">Active (visible to customers)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setFormData(p => ({ ...p, requiresQuote: !p.requiresQuote }))}
            className="w-9 h-5 rounded-full relative transition-colors"
            style={{ background: formData.requiresQuote ? '#f59e0b' : 'rgba(255,255,255,0.15)' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-[#111827] shadow transition-transform"
              style={{ transform: formData.requiresQuote ? 'translateX(16px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm text-white">Requires Custom Quote <span className="text-amber-400 text-xs">(bypasses booking, goes to quote form)</span></span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#34d399,#10b981)' }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {initialData ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const ServiceManagement = ({ services = [], addOns = [], packages = [], onRefresh, adminToken }) => {
  const [activeSubTab, setActiveSubTab]   = useState('services');
  const [editingService, setEditingService] = useState(null);
  const [editingAddOn, setEditingAddOn]     = useState(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateAddOn, setShowCreateAddOn]     = useState(false);
  const { success, error } = useNotifications();

  const vehicleTypes = ['Sedan', 'SUV', 'Truck'];
  const serviceCategories = ['DETAILING', 'PROTECTION', 'RESTORATION', 'MAINTENANCE', 'SPECIALTY'];
  const addOnCategories   = ['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'];

  const api = async (url, method, body) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': adminToken || '',
        ...(adminToken ? { 'X-Admin-Secret': adminToken } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const handleCreateService  = async (d) => { const r = await api('/services', 'POST', d); if (r.success) { onRefresh(); setShowCreateService(false); success('Service created!'); } else error(r.message); };
  const handleUpdateService  = async (id, d) => { const r = await api(`/services/${id}`, 'PUT', d); if (r.success) { onRefresh(); setEditingService(null); success('Service updated!'); } else error(r.message); };
  const handleDeleteService  = async (id) => { if (!confirm('Deactivate this service?')) return; const r = await api(`/services/${id}`, 'DELETE'); if (r.success) { onRefresh(); success('Service deactivated!'); } else error(r.message); };
  const handleCreateAddOn    = async (d) => { const r = await api('/services/addons', 'POST', d); if (r.success) { onRefresh(); setShowCreateAddOn(false); success('Add-on created!'); } else error(r.message); };
  const handleUpdateAddOn    = async (id, d) => { const r = await api(`/services/addons/${id}`, 'PUT', d); if (r.success) { onRefresh(); setEditingAddOn(null); success('Add-on updated!'); } else error(r.message); };
  const handleDeleteAddOn    = async (id) => { if (!confirm('Deactivate this add-on?')) return; const r = await api(`/services/addons/${id}`, 'DELETE'); if (r.success) { onRefresh(); success('Add-on deactivated!'); } else error(r.message); };

  const TabBtn = ({ id, icon: Icon, label, count }) => (
    <button onClick={() => setActiveSubTab(id)}
      className="flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all"
      style={activeSubTab === id
        ? { borderColor: GOLD_S, color: GOLD_S }
        : { borderColor: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
      <Icon className="w-4 h-4" />{label}
      <span className="px-1.5 py-0.5 rounded-full text-xs"
        style={{ background: activeSubTab === id ? 'rgba(0,168,204,0.15)' : 'rgba(255,255,255,0.07)', color: activeSubTab === id ? GOLD_S : 'rgba(255,255,255,0.4)' }}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="text-white font-bold text-lg">Service & Pricing</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Manage services and add-ons</p>
        </div>
        {activeSubTab === 'services' && (
          <button onClick={() => setShowCreateService(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black" style={{ background: GOLD }}><Plus className="w-4 h-4" /> Add Service</button>
        )}
        {activeSubTab === 'addons' && (
          <button onClick={() => setShowCreateAddOn(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}><Plus className="w-4 h-4" /> Add Add-on</button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-6 px-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <TabBtn id="packages" icon={Layers}   label="Packages" count={packages.length} />
        <TabBtn id="services" icon={Settings} label="Services" count={services.length} />
        <TabBtn id="addons"   icon={Package}  label="Add-ons"  count={addOns.length} />
      </div>

      {/* Services list */}
      {activeSubTab === 'services' && (
        <div className="space-y-3">
          {services.length === 0 && (
            <div className="text-center py-14 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No services yet.</p>
            </div>
          )}
          {services.map(svc => (
            <div key={svc.id} className="rounded-2xl p-5 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${svc.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)'}`, opacity: svc.isActive ? 1 : 0.6 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-bold">{svc.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: svc.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: svc.isActive ? '#34d399' : '#f87171' }}>
                      {svc.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,168,204,0.1)', color: GOLD_S }}>
                      {svc.category}
                    </span>
                    {svc.requiresQuote && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        Quote Required
                      </span>
                    )}
                  </div>
                  {svc.description && <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>{svc.description}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {vehicleTypes.map(t => (
                      <div key={t} className="px-3 py-1.5 rounded-lg text-xs"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t} </span>
                        <span className="font-bold" style={{ color: svc.pricing?.[t] ? GOLD_S : 'rgba(255,255,255,0.2)' }}>
                          {svc.pricing?.[t] ? `$${svc.pricing[t]}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditingService(svc.id)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => handleDeleteService(svc.id)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-500/20"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add-ons list */}
      {activeSubTab === 'addons' && (
        <div className="space-y-3">
          {addOns.length === 0 && (
            <div className="text-center py-14 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No add-ons yet.</p>
            </div>
          )}
          {addOns.map(addon => (
            <div key={addon.id} className="rounded-2xl p-5 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${addon.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)'}`, opacity: addon.isActive ? 1 : 0.6 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-bold">{addon.name}</h3>
                    <span className="text-sm font-black" style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      ${addon.price}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: addon.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: addon.isActive ? '#34d399' : '#f87171' }}>
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {addon.requiresQuote && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        Quote Required
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                      {addon.category}
                    </span>
                  </div>
                  {addon.description && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{addon.description}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditingAddOn(addon.id)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => handleDeleteAddOn(addon.id)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/20"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Packages */}
      {activeSubTab === 'packages' && (
        <PackageManagement packages={packages} services={services} addOns={addOns} onRefresh={onRefresh} adminToken={adminToken} />
      )}

      {/* Modals */}
      {showCreateService && <ServiceFormModal isOpen onClose={() => setShowCreateService(false)} onSubmit={handleCreateService} vehicleTypes={vehicleTypes} serviceCategories={serviceCategories} title="Create Service" />}
      {showCreateAddOn   && <AddOnFormModal   isOpen onClose={() => setShowCreateAddOn(false)}   onSubmit={handleCreateAddOn}   addOnCategories={addOnCategories} title="Create Add-on" />}
      {editingService    && <ServiceFormModal isOpen onClose={() => setEditingService(null)} onSubmit={d => handleUpdateService(editingService, d)} vehicleTypes={vehicleTypes} serviceCategories={serviceCategories} title="Edit Service" initialData={services.find(s => s.id === editingService)} />}
      {editingAddOn      && <AddOnFormModal   isOpen onClose={() => setEditingAddOn(null)}   onSubmit={d => handleUpdateAddOn(editingAddOn, d)}   addOnCategories={addOnCategories} title="Edit Add-on" initialData={addOns.find(a => a.id === editingAddOn)} />}
    </div>
  );
};

export default ServiceManagement;
