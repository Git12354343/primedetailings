import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit3, Trash2, Check, X, Loader2,
  AlertCircle, Eye, EyeOff, Phone, Mail, Briefcase,
  CheckCircle, AlertTriangle, RefreshCw, Shield,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const GOLD   = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

const iStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  color: '#fff', padding: '10px 14px', fontSize: '13px',
  outline: 'none', fontFamily: 'inherit',
};
const lStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.8)', marginBottom: '6px',
};
const focus = e => e.target.style.borderColor = GOLD_S;
const blur  = e => e.target.style.borderColor = 'rgba(255,255,255,0.1)';

// ── Form modal ─────────────────────────────────────────────────────────────────
const DetailerFormModal = ({ initial, onClose, onSubmit, saving }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:     initial?.name     || '',
    email:    initial?.email    || '',
    phone:    initial?.phone    || '',
    password: '',
    isActive: initial?.isActive ?? true,
  });
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: GOLD_S }} />
            <h3 className="font-bold text-white">{isEdit ? 'Edit Detailer' : 'Add Detailer Account'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label style={lStyle}>Full Name *</label>
            <input style={iStyle} value={form.name} placeholder="Marcus Johnson"
              onChange={e => set('name', e.target.value)} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={lStyle}>Email *</label>
            <input style={iStyle} type="email" value={form.email} placeholder="marcus@primedetailing.ca"
              disabled={isEdit} onChange={e => set('email', e.target.value)} onFocus={focus} onBlur={blur}
              title={isEdit ? 'Email cannot be changed after creation' : ''}
              className={isEdit ? 'opacity-50 cursor-not-allowed' : ''} />
          </div>
          <div>
            <label style={lStyle}>Phone *</label>
            <input style={iStyle} type="tel" value={form.phone} placeholder="(514) 555-0123"
              onChange={e => set('phone', e.target.value)} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={lStyle}>{isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <div className="relative">
              <input style={iStyle} type={showPw ? 'text' : 'password'} value={form.password}
                placeholder={isEdit ? '••••••••' : 'Min. 8 characters'}
                onChange={e => set('password', e.target.value)} onFocus={focus} onBlur={blur} />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => set('isActive', !form.isActive)}
                className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: form.isActive ? GOLD_S : 'rgba(255,255,255,0.15)' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: form.isActive ? 'translateX(16px)' : 'translateX(2px)' }} />
              </div>
              <span className="text-sm text-white">Account active (can log in)</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={() => onSubmit(form)} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: GOLD }}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Check className="w-4 h-4" /> {isEdit ? 'Update' : 'Create Account'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const DetailerManagement = ({ adminToken, authFetch, onRefreshGlobal }) => {
  const [detailers,    setDetailers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editingId,    setEditingId]    = useState(null); // null | 'new' | id
  const [saving,       setSaving]       = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const { success, error: notifyErr }   = useNotifications();

  const load = async () => {
    setLoading(true);
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/admin/detailers`);
      if (data.success) setDetailers(data.detailers);
    } catch { notifyErr('Failed to load detailers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getInitial = () => editingId !== 'new' ? detailers.find(d => d.id === editingId) : null;

  const handleSubmit = async (form) => {
    if (!form.name || !form.email || !form.phone) return notifyErr('Name, email and phone are required');
    if (editingId === 'new' && !form.password)    return notifyErr('Password is required for new accounts');
    if (form.password && form.password.length < 8) return notifyErr('Password must be at least 8 characters');

    setSaving(true);
    try {
      const isNew = editingId === 'new';
      const url   = isNew
        ? `${import.meta.env.VITE_API_URL}/admin/detailers`
        : `${import.meta.env.VITE_API_URL}/admin/detailers/${editingId}`;
      const data = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        body:   JSON.stringify(form),
      });
      if (data.success) {
        success(isNew ? 'Detailer account created!' : 'Detailer updated!');
        setEditingId(null);
        load();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        notifyErr(data.message || 'Failed');
      }
    } catch { notifyErr('Network error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (d) => {
    setDeactivating(d.id);
    try {
      const data = await authFetch(`${import.meta.env.VITE_API_URL}/admin/detailers/${d.id}`, {
        method: 'PUT',
        body:   JSON.stringify({ isActive: !d.isActive }),
      });
      if (data.success) {
        success(d.isActive ? `${d.name} deactivated` : `${d.name} reactivated`);
        load();
        if (onRefreshGlobal) onRefreshGlobal();
      } else {
        notifyErr(data.message);
      }
    } catch { notifyErr('Network error'); }
    finally { setDeactivating(null); }
  };

  const activeCount   = detailers.filter(d =>  d.isActive).length;
  const inactiveCount = detailers.filter(d => !d.isActive).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
    </div>
  );

  return (
    <div className="space-y-5">
      {editingId !== null && (
        <DetailerFormModal
          initial={getInitial()}
          onClose={() => setEditingId(null)}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="text-white font-bold text-lg">Detailer Accounts</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setEditingId('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black"
            style={{ background: GOLD }}>
            <Plus className="w-4 h-4" /> Add Detailer
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Each detailer gets a Supabase login. They sign in at <span className="text-white font-medium">/detailer-login</span> with
          their email and the password you set here. Deactivating prevents login but preserves booking history.
        </p>
      </div>

      {/* Empty state */}
      {detailers.length === 0 && (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-bold mb-1">No detailers yet</p>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Create the first detailer account to start assigning jobs.
          </p>
          <button onClick={() => setEditingId('new')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: GOLD }}>
            Add First Detailer
          </button>
        </div>
      )}

      {/* Detailer cards */}
      <div className="space-y-3">
        {detailers.map(d => {
          const initials      = d.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const isDeactivating = deactivating === d.id;
          return (
            <div key={d.id} className="rounded-2xl p-5 transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: d.isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(239,68,68,0.15)',
                opacity: d.isActive ? 1 : 0.65,
              }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: d.isActive ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.06)', color: d.isActive ? GOLD_S : '#6b7280' }}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-bold">{d.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={d.isActive
                        ? { background: 'rgba(52,211,153,0.1)',  color: '#34d399' }
                        : { background: 'rgba(239,68,68,0.1)',   color: '#f87171' }}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <Mail className="w-3 h-3" />{d.email}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <Phone className="w-3 h-3" />{d.phone}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <Briefcase className="w-3 h-3" />{d.totalBookings || 0} total jobs
                    </span>
                    {(d.activeBookings || 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#f59e0b' }}>
                        <AlertTriangle className="w-3 h-3" />{d.activeBookings} active
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditingId(d.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => handleToggle(d)} disabled={isDeactivating}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={d.isActive
                      ? { background: 'rgba(239,68,68,0.08)',  border: '1px solid rgba(239,68,68,0.2)' }
                      : { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
                    title={d.isActive ? 'Deactivate' : 'Reactivate'}>
                    {isDeactivating
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                      : d.isActive
                        ? <Trash2      className="w-3.5 h-3.5 text-red-400" />
                        : <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {d.supabaseUserId ? 'Supabase auth linked' : 'No auth account yet — use Edit to set a password'}
                </span>
                <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  ID #{d.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetailerManagement;
