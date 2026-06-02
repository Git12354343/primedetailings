// src/components/admin/AdminExport.jsx
import React, { useState } from 'react';
import { Download, Loader2, FileText, Users, ClipboardList } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ExportCard = ({ icon: Icon, title, description, endpoint, filters, adminToken }) => {
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ dateFrom:'', dateTo:'' });
  const [status, setStatus] = useState('');

  const download = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams(Object.fromEntries([
        ...Object.entries(dates).filter(([,v]) => v),
        ...(status ? [['status', status]] : []),
      ]));
      const res = await fetch(`${API}/export/${endpoint}?${p}`, { headers:{ 'x-admin-secret': adminToken } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${endpoint}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(0,168,204,0.1)' }}>
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">{title}</h3>
          <p className="text-gray-500 text-xs">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[10px] text-gray-600 uppercase tracking-wide mb-1">From</label>
          <input type="date" value={dates.dateFrom} onChange={e => setDates(d => ({...d, dateFrom: e.target.value}))}
            style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-600 uppercase tracking-wide mb-1">To</label>
          <input type="date" value={dates.dateTo} onChange={e => setDates(d => ({...d, dateTo: e.target.value}))}
            style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }} />
        </div>
      </div>
      {filters?.statuses && (
        <div className="mb-3">
          <label className="block text-[10px] text-gray-600 uppercase tracking-wide mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }}>
            <option value="">All statuses</option>
            {filters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      <button onClick={download} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#0b0f1a] disabled:opacity-50"
        style={{ background:'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Download className="w-4 h-4" /> Download CSV</>}
      </button>
    </div>
  );
};

const AdminExport = ({ adminToken }) => (
  <div className="p-4 sm:p-6">
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">Export Data</h2>
      <p className="text-gray-500 text-sm mt-0.5">Download as CSV. UTF-8 encoded, Excel compatible.</p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <ExportCard icon={ClipboardList} title="Bookings" description="All booking records with customer info" endpoint="bookings" adminToken={adminToken}
        filters={{ statuses: ['PENDING','CONFIRMED','EN_ROUTE','IN_PROGRESS','COMPLETED','CANCELED','NO_SHOW'] }} />
      <ExportCard icon={FileText} title="Quotes" description="Retail quote requests" endpoint="quotes" adminToken={adminToken}
        filters={{ statuses: ['NEW','REVIEWING','QUOTED','ACCEPTED','DECLINED','CONVERTED'] }} />
      <ExportCard icon={Users} title="Customers" description="Unique customers from bookings" endpoint="customers" adminToken={adminToken} />
    </div>
  </div>
);

export default AdminExport;
