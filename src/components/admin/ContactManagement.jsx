// src/components/admin/ContactManagement.jsx
// Displays all contact form submissions. Admin can mark as read/resolved/archived
// and delete. Fetches from GET /api/admin/contacts (protected).
import React, { useEffect, useState, useCallback } from 'react';
import {
  Mail, Phone, Clock, Tag, CheckCircle, Archive,
  Trash2, RefreshCw, Loader2, MessageSquare, Circle, Eye
} from 'lucide-react';

const API   = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
const hdrs  = () => ({
  'Content-Type': 'application/json',
  'X-Admin-Secret': token(),
  Authorization: `Bearer ${token()}`,
});

const STATUS_COLORS = {
  NEW:         { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#f59e0b',  label: 'New' },
  IN_PROGRESS: { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  color: '#60a5fa',  label: 'In Progress' },
  RESOLVED:    { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  color: '#34d399',  label: 'Resolved' },
  ARCHIVED:    { bg: 'rgba(255,255,255,0.05)',border: 'rgba(255,255,255,0.1)', color: '#6b7280',  label: 'Archived' },
};

const Badge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.NEW;
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-CA', {
  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const ContactManagement = () => {
  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('ALL');
  const [expanded, setExpanded]   = useState(null);
  const [acting, setActing]       = useState(null); // id being mutated

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/admin/contacts`, { headers: hdrs() });
      const data = await res.json();
      if (data.success) setContacts(data.contacts);
      else setError(data.message || 'Failed to load contacts');
    } catch {
      setError('Cannot connect to backend.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    setActing(id);
    try {
      const res  = await fetch(`${API}/admin/contacts/${id}`, {
        method: 'PUT',
        headers: hdrs(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setContacts(p => p.map(c => c.id === id ? { ...c, status } : c));
    } catch { /* silent */ } finally { setActing(null); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this contact message?')) return;
    setActing(id);
    try {
      const res  = await fetch(`${API}/admin/contacts/${id}`, { method: 'DELETE', headers: hdrs() });
      const data = await res.json();
      if (data.success) setContacts(p => p.filter(c => c.id !== id));
    } catch { /* silent */ } finally { setActing(null); }
  };

  const filtered = filter === 'ALL'
    ? contacts
    : contacts.filter(c => c.status === filter);

  const counts = {
    ALL: contacts.length,
    NEW: contacts.filter(c => c.status === 'NEW').length,
    IN_PROGRESS: contacts.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED: contacts.filter(c => c.status === 'RESOLVED').length,
    ARCHIVED: contacts.filter(c => c.status === 'ARCHIVED').length,
  };

  const FILTERS = [
    { key: 'ALL',         label: 'All' },
    { key: 'NEW',         label: 'New' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED',    label: 'Resolved' },
    { key: 'ARCHIVED',    label: 'Archived' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Contact Messages</h2>
          <p className="text-gray-500 text-sm">Submissions from the contact form.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={filter === f.key
              ? { background: 'rgba(0,168,204,0.15)', border: '1px solid rgba(0,168,204,0.35)', color: '#00d4ff' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
            {f.label}
            {counts[f.key] > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: filter === f.key ? 'rgba(0,168,204,0.3)' : 'rgba(255,255,255,0.1)' }}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No messages{filter !== 'ALL' ? ` with status "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const isExpanded = expanded === c.id;
            const isNew      = c.status === 'NEW';
            return (
              <div key={c.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: isNew ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.03)',
                  border: isNew ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.07)',
                }}>

                {/* Row header */}
                <div className="flex items-start gap-3 p-4">
                  {/* Unread dot */}
                  <div className="mt-1 flex-shrink-0">
                    {isNew
                      ? <Circle className="w-2.5 h-2.5 fill-cyan-400 text-cyan-400" />
                      : <Circle className="w-2.5 h-2.5 text-transparent" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                    setExpanded(isExpanded ? null : c.id);
                    if (isNew && !isExpanded) setStatus(c.id, 'IN_PROGRESS');
                  }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-bold text-sm">{c.name}</span>
                      <Badge status={c.status} />
                      {c.subject && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                          {c.subject}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <Mail className="w-3 h-3" />{c.email}
                      </span>
                      {c.phone && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Phone className="w-3 h-3" />{c.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <Clock className="w-3 h-3" />{formatDate(c.createdAt)}
                      </span>
                    </div>
                    {/* Preview / full message */}
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button title="View" onClick={() => { setExpanded(isExpanded ? null : c.id); if (isNew && !isExpanded) setStatus(c.id, 'IN_PROGRESS'); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button title="Mark resolved" onClick={() => setStatus(c.id, c.status === 'RESOLVED' ? 'IN_PROGRESS' : 'RESOLVED')}
                      disabled={acting === c.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-green-500/10"
                      style={{ background: 'rgba(255,255,255,0.04)', color: c.status === 'RESOLVED' ? '#34d399' : '#6b7280' }}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button title="Archive" onClick={() => setStatus(c.id, c.status === 'ARCHIVED' ? 'NEW' : 'ARCHIVED')}
                      disabled={acting === c.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.04)', color: c.status === 'ARCHIVED' ? '#00d4ff' : '#6b7280' }}>
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button title="Delete" onClick={() => remove(c.id)} disabled={acting === c.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#6b7280' }}>
                      {acting === c.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />}
                    </button>
                  </div>
                </div>

                {/* Expanded reply hints */}
                {isExpanded && (
                  <div className="px-4 pb-4 flex gap-3 flex-wrap border-t pt-3"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <a href={`mailto:${c.email}?subject=Re: ${c.subject || 'Your inquiry'}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
                      style={{ background: 'rgba(0,168,204,0.12)', border: '1px solid rgba(0,168,204,0.25)', color: '#00d4ff' }}>
                      <Mail className="w-3 h-3" /> Reply by email
                    </a>
                    {c.phone && (
                      <a href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
                        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                        <Phone className="w-3 h-3" /> Call back
                      </a>
                    )}
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
                        style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', color: '#25d366' }}>
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContactManagement;
