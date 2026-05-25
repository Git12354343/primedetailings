import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Car, RefreshCw, Loader2 } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';
const GOLD_MID = '#e8c46a';

const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;

// ── Custom tooltip ────────────────────────────────────────────────────────────
const GoldTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl"
      style={{ background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(201,168,76,0.3)', backdropFilter: 'blur(12px)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD_S }}>
        Week of {new Date(d.weekStart + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
      </p>
      <p className="text-xl font-black text-white">${d.revenue.toFixed(2)}</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{d.jobs} job{d.jobs !== 1 ? 's' : ''}</p>
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, subUp }) => (
  <div className="rounded-2xl p-5"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(201,168,76,0.1)' }}>
        <Icon className="w-4 h-4" style={{ color: GOLD_S }} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
    <p className="text-2xl font-black mb-1" style={{
      background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>{value}</p>
    {sub && (
      <div className="flex items-center gap-1">
        {subUp === true  && <TrendingUp  className="w-3 h-3 text-green-400" />}
        {subUp === false && <TrendingDown className="w-3 h-3 text-red-400"  />}
        <span className="text-xs" style={{ color: subUp === true ? '#6ee7b7' : subUp === false ? '#fca5a5' : 'rgba(255,255,255,0.35)' }}>
          {sub}
        </span>
      </div>
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const RevenueAnalytics = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeBar, setActiveBar] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || localStorage.getItem('detailerToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.analytics);
      else setError(json.message || 'Failed to load revenue data');
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxWeekly = data?.weekly?.length ? Math.max(...data.weekly.map(w => w.revenue)) : 1;

  if (loading) return (
    <div className="flex flex-col items-center gap-3 py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading analytics...</p>
    </div>
  );

  if (error) return (
    <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <p className="text-red-400 mb-3 text-sm">{error}</p>
      <button onClick={load} className="flex items-center gap-2 mx-auto text-sm font-semibold" style={{ color: GOLD_S }}>
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );

  if (!data) return null;

  const changeLabel = data.monthChange !== null
    ? `${data.monthChange >= 0 ? '+' : ''}${data.monthChange}% vs last month`
    : 'No prior month data';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="text-white font-bold text-lg">Revenue Analytics</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Completed bookings · Last 8 weeks</p>
        </div>
        <button onClick={load}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="This month"  value={`$${data.monthRevenue.toFixed(0)}`}
          sub={changeLabel} subUp={data.monthChange > 0 ? true : data.monthChange < 0 ? false : undefined} />
        <StatCard icon={TrendingUp} label="Avg ticket"  value={`$${data.avgTicket.toFixed(0)}`}
          sub="per completed job" />
        <StatCard icon={Briefcase}  label="Jobs (8wks)" value={data.totalJobs} />
        <StatCard icon={DollarSign} label="Last month"  value={`$${data.lastMonthRev.toFixed(0)}`} />
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: GOLD_S }}>Weekly Revenue</p>
        {data.weekly.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No completed bookings yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weekly} barSize={32} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
              onMouseLeave={() => setActiveBar(null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="weekStart" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                tickFormatter={v => new Date(v + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                tickFormatter={v => fmt(v)} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<GoldTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}
                onMouseEnter={(_, i) => setActiveBar(i)}>
                {data.weekly.map((_, i) => (
                  <Cell key={i}
                    fill={activeBar === i ? '#f5d376' : i === data.weekly.length - 1 ? GOLD_MID : 'rgba(201,168,76,0.45)'}
                    style={{ transition: 'fill 0.15s' }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top vehicle types */}
      {data.topVehicles?.length > 0 && (
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD_S }}>Revenue by Vehicle Type</p>
          <div className="space-y-3">
            {data.topVehicles.map((v, i) => {
              const pct = maxWeekly > 0 ? Math.round((v.revenue / data.topVehicles[0].revenue) * 100) : 0;
              return (
                <div key={v.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5" style={{ color: GOLD_S }} />
                      <span className="text-sm text-white font-medium">{v.type}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: GOLD_S }}>${v.revenue.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: i === 0 ? GOLD_MID : 'rgba(201,168,76,0.4)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueAnalytics;