// src/components/admin/AdminAuditLog.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ENTITY_COLORS = { booking:'#60a5fa', quote:'#00d4ff', service:'#34d399', addOn:'#f59e0b', package:'#a78bfa', admin:'#f87171' };
const ACTION_BADGE  = { cancelled:'bg-red-500/15 text-red-300', rescheduled:'bg-amber-500/15 text-amber-300', status_changed:'bg-blue-500/15 text-blue-300', created:'bg-green-500/15 text-green-300', updated:'bg-cyan-500/15 text-cyan-300', accepted:'bg-green-500/15 text-green-300', declined:'bg-red-500/15 text-red-300' };

const badgeClass = (action) => {
  for (const [k, cls] of Object.entries(ACTION_BADGE)) { if (action.includes(k)) return cls; }
  return 'bg-white/5 text-gray-400';
};

const AdminAuditLog = ({ adminToken }) => {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState({ entityType:'', action:'', dateFrom:'', dateTo:'' });
  const [expandedId, setExpandedId] = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:50, ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)) });
      const res  = await fetch(`${API}/audit?${p}`, { headers:{ 'x-admin-secret': adminToken } });
      const data = await res.json();
      if (data.success) { setLogs(data.logs); setTotal(data.total); }
    } catch {} finally { setLoading(false); }
  }, [adminToken, page, filters]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const setF = (k, v) => { setFilters(f => ({...f, [k]:v})); setPage(1); };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Audit Log</h2>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} entries</p>
        </div>
        <button onClick={fetch_} className="p-2 rounded-lg text-gray-400 hover:text-white" style={{ background:'rgba(255,255,255,0.05)' }}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[['entityType','Entity Type'],['action','Action contains'],['dateFrom','From Date'],['dateTo','To Date']].map(([k, ph]) => (
          <input key={k} placeholder={ph} value={filters[k]} type={k.includes('Date') ? 'date' : 'text'}
            onChange={e => setF(k, e.target.value)}
            style={{ padding:'9px 12px', borderRadius:'10px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No log entries found.</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="rounded-xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpandedId(id => id === log.id ? null : log.id)}>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background:`${ENTITY_COLORS[log.entityType]||'#94a3b8'}20`, color: ENTITY_COLORS[log.entityType]||'#94a3b8', border:`1px solid ${ENTITY_COLORS[log.entityType]||'#94a3b8'}40` }}>
                  {log.entityType}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass(log.action)}`}>{log.action}</span>
                <span className="text-gray-500 text-xs">#{log.entityId}</span>
                <span className="ml-auto text-gray-600 text-xs">{new Date(log.createdAt).toLocaleString('en-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                {expandedId === log.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
              </button>
              {expandedId === log.id && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 grid grid-cols-2 gap-3">
                  {log.oldValue && <div><p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Before</p><pre className="text-xs text-gray-400 overflow-x-auto">{JSON.stringify(log.oldValue, null, 2)}</pre></div>}
                  {log.newValue && <div><p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">After</p><pre className="text-xs text-gray-300 overflow-x-auto">{JSON.stringify(log.newValue, null, 2)}</pre></div>}
                  {log.note && <div className="col-span-2"><p className="text-xs text-gray-500">{log.note}</p></div>}
                  {log.adminIp && <p className="col-span-2 text-[10px] text-gray-600">IP: {log.adminIp}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-center gap-2 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1 || loading} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 disabled:opacity-40" style={{ background:'rgba(255,255,255,0.05)' }}>Prev</button>
          <span className="px-3 py-1.5 text-xs text-gray-400">Page {page} of {Math.ceil(total/50)}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/50) || loading} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 disabled:opacity-40" style={{ background:'rgba(255,255,255,0.05)' }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
