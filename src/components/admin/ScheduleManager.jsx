import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Plus, Trash2, AlertTriangle, CheckCircle, Settings, Loader2 } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_CONFIG = {
  workingDays: [1, 2, 3, 4, 5],
  operatingHours: { start: 8, end: 18 },
  timeSlots: [
    { id: 'morning',   label: '8:00 AM',  startHour: 8,  endHour: 14 },
    { id: 'afternoon', label: '12:00 PM', startHour: 12, endHour: 18 },
  ],
  maxBookingsPerSlot: 1,
  minAdvanceHours: 24,
  maxAdvanceDays: 60,
};

const sanitizeConfig = (raw) => {
  if (!raw) return DEFAULT_CONFIG;
  return {
    workingDays: Array.isArray(raw.workingDays) ? raw.workingDays : DEFAULT_CONFIG.workingDays,
    operatingHours: {
      start: Number.isFinite(raw.operatingHours?.start) ? raw.operatingHours.start : DEFAULT_CONFIG.operatingHours.start,
      end:   Number.isFinite(raw.operatingHours?.end)   ? raw.operatingHours.end   : DEFAULT_CONFIG.operatingHours.end,
    },
    timeSlots: Array.isArray(raw.timeSlots)
      ? raw.timeSlots.map(s => ({
          id:        s.id        || `slot_${Date.now()}`,
          label:     s.label     || '',
          startHour: Number.isFinite(s.startHour) ? s.startHour : 8,
          endHour:   Number.isFinite(s.endHour)   ? s.endHour   : 17,
        }))
      : DEFAULT_CONFIG.timeSlots,
    maxBookingsPerSlot: Number.isFinite(raw.maxBookingsPerSlot) ? raw.maxBookingsPerSlot : DEFAULT_CONFIG.maxBookingsPerSlot,
    minAdvanceHours:    Number.isFinite(raw.minAdvanceHours)    ? raw.minAdvanceHours    : DEFAULT_CONFIG.minAdvanceHours,
    maxAdvanceDays:     Number.isFinite(raw.maxAdvanceDays)     ? raw.maxAdvanceDays     : DEFAULT_CONFIG.maxAdvanceDays,
  };
};

const safeInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
};

// ── Shared input styles ────────────────────────────────────────────────────────
const iBase = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '8px 12px', fontSize: '13px', outline: 'none' };
const iNum  = { ...iBase, width: '100%', fontSize: '1.5rem', fontWeight: '900', textAlign: 'center', color: '#00d4ff', borderRadius: '12px', padding: '12px' };
const iSlot = { ...iBase, width: '7rem' };
const iHour = { ...iBase, width: '4rem', textAlign: 'center' };
const iDate = { ...iBase, flex: 1 };
const selStyle = { ...iBase, cursor: 'pointer', width: '100%' };
const lGold = { display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(0,168,204,0.7)', marginBottom: '6px' };
const cardD = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

const ScheduleManager = () => {
  const [config, setConfig]         = useState(sanitizeConfig(null));
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');
  const [newBlockDate, setNewBlockDate]     = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [activeSection, setActiveSection]   = useState('hours');

  useEffect(() => { fetchConfig(); fetchBlockedDates(); }, []);

  const fetchConfig = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/schedule/config`);
      const data = await res.json();
      if (data.success && data.config) setConfig(sanitizeConfig(data.config));
    } catch (e) { console.error('fetchConfig error:', e); }
    finally { setLoading(false); }
  };

  const fetchBlockedDates = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/schedule/blocked-dates`);
      const data = await res.json();
      if (data.success) setBlockedDates(data.blockedDates || []);
    } catch (e) { console.error('fetchBlockedDates error:', e); }
  };

  const saveConfig = async () => {
    setSaving(true); setError('');
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/schedule/config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminToken || '' }, body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(data.message || 'Failed to save');
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const toggleWorkingDay   = (i)   => setConfig(p => ({ ...p, workingDays: p.workingDays.includes(i) ? p.workingDays.filter(d => d !== i) : [...p.workingDays, i].sort() }));
  const updateOperatingHours = (f, v) => setConfig(p => ({ ...p, operatingHours: { ...p.operatingHours, [f]: safeInt(v, p.operatingHours[f]) } }));
  const updateTimeSlot = (idx, field, val) => {
    setConfig(p => ({
      ...p,
      timeSlots: p.timeSlots.map((s, i) => {
        if (i !== idx) return s;
        if (field === 'label') return { ...s, label: val };
        return { ...s, [field]: safeInt(val, s[field]) };
      }),
    }));
  };
  const removeTimeSlot = (idx) => setConfig(p => ({ ...p, timeSlots: p.timeSlots.filter((_, i) => i !== idx) }));
  const addTimeSlot    = ()    => setConfig(p => ({ ...p, timeSlots: [...p.timeSlots, { id: `slot_${Date.now()}`, label: 'New Slot', startHour: 9, endHour: 15 }] }));
  const updateCapacity = (field, val) => {
    const fallbacks = { maxBookingsPerSlot: 1, minAdvanceHours: 24, maxAdvanceDays: 60 };
    setConfig(p => ({ ...p, [field]: safeInt(val, fallbacks[field]) }));
  };

  const blockDate = async () => {
    if (!newBlockDate) return;
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/schedule/blocked-dates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newBlockDate, reason: newBlockReason || 'Blocked by admin' }),
      });
      const data = await res.json();
      if (data.success) { setBlockedDates(data.blockedDates || []); setNewBlockDate(''); setNewBlockReason(''); }
    } catch (e) { console.error('blockDate error:', e); }
  };

  const unblockDate = async (date) => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/schedule/blocked-dates/${date}`, { method: 'DELETE', headers: { 'X-Admin-Secret': adminToken || '' } });
      const data = await res.json();
      if (data.success) setBlockedDates(data.blockedDates || []);
    } catch (e) { console.error('unblockDate error:', e); }
  };

  const sections = [
    { id: 'hours',    label: 'Working Hours', icon: Clock },
    { id: 'capacity', label: 'Capacity',       icon: Settings },
    { id: 'blocked',  label: 'Block Dates',    icon: Calendar },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid rgba(0,168,204,0.2)', borderTopColor: GOLD_S }} />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl" style={cardD}>
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: GOLD_S }} /> Schedule Management
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Control working days, hours, availability and blocked dates
          </p>
        </div>
        <button onClick={saveConfig} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50"
          style={{ background: saved ? 'linear-gradient(135deg,#34d399,#10b981)' : GOLD }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</>
            : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tabs + content card */}
      <div className="rounded-2xl overflow-hidden" style={cardD}>
        {/* Tab strip */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {sections.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  borderBottom: active ? `2px solid ${GOLD_S}` : '2px solid transparent',
                  color: active ? GOLD_S : 'rgba(255,255,255,0.4)',
                  background: active ? 'rgba(0,168,204,0.06)' : 'transparent',
                }}>
                <Icon className="w-4 h-4" /> {s.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">

          {/* ── Working Hours ──────────────────────────────────────────────── */}
          {activeSection === 'hours' && (
            <div className="space-y-6">

              {/* Working days */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Working Days</h3>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_NAMES.map((day, idx) => {
                    const active = config.workingDays.includes(idx);
                    return (
                      <button key={idx} onClick={() => toggleWorkingDay(idx)}
                        className="py-2 px-1 text-xs font-semibold rounded-xl transition-all"
                        style={active
                          ? { background: GOLD, color: '#0b0f1a' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Active: {config.workingDays.map(d => DAY_NAMES[d]?.slice(0, 3)).join(', ') || 'None'}
                </p>
              </div>

              {/* Operating hours */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Operating Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={lGold}>Opening Hour</label>
                    <select style={selStyle} value={config.operatingHours.start}
                      onChange={e => updateOperatingHours('start', e.target.value)}>
                      {Array.from({ length: 12 }, (_, i) => i + 6).map(h => (
                        <option key={h} value={h} style={{ background: '#1a1a1a' }}>
                          {h}:00 {h < 12 ? 'AM' : 'PM'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lGold}>Closing Hour</label>
                    <select style={selStyle} value={config.operatingHours.end}
                      onChange={e => updateOperatingHours('end', e.target.value)}>
                      {Array.from({ length: 12 }, (_, i) => i + 12).map(h => (
                        <option key={h} value={h} style={{ background: '#1a1a1a' }}>
                          {h > 12 ? h - 12 : h}:00 PM
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Time slots */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Time Slots</h3>
                <div className="space-y-2">
                  {config.timeSlots.map((slot, idx) => (
                    <div key={slot.id || idx} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <input style={iSlot} value={slot.label} placeholder="Label"
                        onChange={e => updateTimeSlot(idx, 'label', e.target.value)} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Start</span>
                      <input style={iHour} type="number" min={6} max={20}
                        value={Number.isFinite(slot.startHour) ? slot.startHour : ''}
                        onChange={e => updateTimeSlot(idx, 'startHour', e.target.value)} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>End</span>
                      <input style={iHour} type="number" min={6} max={24}
                        value={Number.isFinite(slot.endHour) ? slot.endHour : ''}
                        onChange={e => updateTimeSlot(idx, 'endHour', e.target.value)} />
                      <button onClick={() => removeTimeSlot(idx)}
                        className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-red-500/20"
                        style={{ color: '#f87171' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addTimeSlot}
                    className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl transition-colors mt-1"
                    style={{ color: GOLD_S, background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
                    <Plus className="w-4 h-4" /> Add Time Slot
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Capacity ───────────────────────────────────────────────────── */}
          {activeSection === 'capacity' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {[
                { field: 'maxBookingsPerSlot', label: 'Max Bookings Per Slot', desc: 'How many jobs per time slot', min: 1, max: 10 },
                { field: 'minAdvanceHours',    label: 'Min Advance Hours',     desc: 'Minimum hours before booking', min: 1, max: 168 },
                { field: 'maxAdvanceDays',     label: 'Max Advance Days',      desc: 'How far in advance to book', min: 7, max: 365 },
              ].map(({ field, label, desc, min, max }) => (
                <div key={field} className="p-5 rounded-2xl" style={cardD}>
                  <label style={lGold}>{label}</label>
                  <input type="number" min={min} max={max} style={iNum}
                    value={Number.isFinite(config[field]) ? config[field] : ''}
                    onChange={e => updateCapacity(field, e.target.value)} />
                  <p className="text-xs mt-2 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                </div>
              ))}

            </div>
          )}

          {/* ── Blocked Dates ──────────────────────────────────────────────── */}
          {activeSection === 'blocked' && (
            <div className="space-y-5">

              {/* Add block */}
              <div className="p-4 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#fbbf24' }}>
                  <AlertTriangle className="w-4 h-4" /> Block a Date
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <input type="date" style={iDate}
                    value={newBlockDate} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setNewBlockDate(e.target.value)} />
                  <input style={iDate} placeholder="Reason (optional)"
                    value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} />
                  <button onClick={blockDate} disabled={!newBlockDate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black disabled:opacity-50"
                    style={{ background: GOLD }}>
                    <Plus className="w-4 h-4" /> Block
                  </button>
                </div>
              </div>

              {/* List */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">
                  Blocked Dates ({blockedDates.length})
                </h3>
                {blockedDates.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No dates blocked</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...blockedDates].sort((a, b) => a.date.localeCompare(b.date)).map(b => (
                      <div key={b.date} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div>
                          <span className="font-medium text-sm" style={{ color: '#fca5a5' }}>
                            {new Date(b.date + 'T12:00:00').toLocaleDateString('en-CA', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </span>
                          {b.reason && (
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>{b.reason}</p>
                          )}
                        </div>
                        <button onClick={() => unblockDate(b.date)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20"
                          style={{ color: '#f87171' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;
