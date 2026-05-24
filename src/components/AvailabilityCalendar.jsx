import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Ban } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const AvailabilityCalendar = ({ selectedDate, onDateSelect, businessConfig, className = '' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const getViewRange = useCallback(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const last  = new Date(y, m + 1, 0);
    const start = new Date(first); start.setDate(start.getDate() - first.getDay());
    const end   = new Date(last);  end.setDate(end.getDate() + (6 - last.getDay()));
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  }, [currentMonth]);

  const fetchAvailability = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { startDate, endDate } = getViewRange();
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/availability?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (data.success) {
        const map = {};
        (data.availability || []).forEach(d => { map[d.date] = d; });
        setAvailability(map);
      } else {
        setError(data.message || 'Failed to load calendar');
      }
    } catch {
      setError('Could not load calendar data');
    } finally {
      setLoading(false);
    }
  }, [getViewRange]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const getDays = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const startDate = new Date(first);
    startDate.setDate(startDate.getDate() - first.getDay());

    const todayStr = new Date().toISOString().split('T')[0];
    const days = [];
    const cur  = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = cur.toISOString().split('T')[0];
      days.push({
        date: new Date(cur), dateStr,
        isCurrentMonth: cur.getMonth() === m,
        isToday:        dateStr === todayStr,
        isSelected:     dateStr === selectedDate,
        data:           availability[dateStr],
      });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  const classify = (day) => {
    if (!day.isCurrentMonth) return 'other';
    const d = day.data;
    if (!d)               return loading ? 'loading' : 'unknown';
    if (d.isPast)         return 'past';
    if (d.isBlocked)      return 'blocked';
    if (!d.isWorkingDay)  return 'closed';
    const avail = d.timeSlots?.some(s => s.available);
    if (!avail)           return 'full';
    if (day.isSelected)   return 'selected';
    return 'available';
  };

  const canSelect = (type) => type === 'available' || type === 'selected';

  const handleClick = (day) => {
    const type = classify(day);
    if (canSelect(type)) onDateSelect?.(day.dateStr, day.data);
  };

  const navigate = (dir) => setCurrentMonth(prev => {
    const n = new Date(prev); n.setMonth(prev.getMonth() + dir); return n;
  });

  const CELL_STYLES = {
    other:     { opacity: 0, pointerEvents: 'none' },
    loading:   { color: '#374151' },
    unknown:   { color: '#374151' },
    past:      { color: '#2d2d2d', cursor: 'not-allowed' },
    closed:    { color: '#374151', cursor: 'not-allowed' },
    blocked:   { color: '#4b5563', cursor: 'not-allowed' },
    full:      { color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'not-allowed' },
    selected:  { background: 'linear-gradient(135deg,#c9a84c,#f5d376)', color: '#0a0a0a', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 14px rgba(201,168,76,0.4)' },
    available: { color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', cursor: 'pointer' },
  };

  const days = getDays();

  return (
    <div className={`rounded-2xl p-4 ${className}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />}
          {error && (
            <button onClick={fetchAvailability} className="text-red-400 hover:text-red-300">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#f5d376' }}>
            Today
          </button>
          <button onClick={() => navigate(1)} disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl text-xs text-red-400 text-center"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error} — <button onClick={fetchAvailability} className="underline">retry</button>
        </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const type  = classify(day);
          const style = CELL_STYLES[type] || {};
          return (
            <div
              key={i}
              onClick={() => handleClick(day)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '36px', borderRadius: '8px',
                fontSize: '13px', fontWeight: '500',
                transition: 'all 0.15s',
                border: '1px solid transparent',
                ...style,
              }}
              title={
                type === 'available' ? `${day.data?.timeSlots?.filter(s => s.available).length} slot(s)` :
                type === 'full'      ? 'Fully booked' :
                type === 'closed'    ? 'Closed' :
                type === 'blocked'   ? 'Blocked' :
                type === 'past'      ? 'Past' : ''
              }
            >
              <span>{day.isCurrentMonth ? day.date.getDate() : ''}</span>

              {/* Today ring */}
              {day.isToday && day.isCurrentMonth && type !== 'selected' && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '8px',
                  border: '2px solid rgba(201,168,76,0.4)', pointerEvents: 'none',
                }} />
              )}

              {/* Blocked icon */}
              {type === 'blocked' && day.isCurrentMonth && (
                <Ban style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, color: '#4b5563' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { color: '#34d399', label: 'Available' },
          { color: '#ef4444', label: 'Booked' },
          { color: '#4b5563', label: 'Closed' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-gray-500 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected date chip */}
      {selectedDate && availability[selectedDate] && (
        <div className="mt-3 py-2 px-3 rounded-xl text-center"
          style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <p className="text-yellow-400 text-xs font-semibold">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-CA', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
