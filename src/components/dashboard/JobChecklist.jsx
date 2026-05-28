// src/components/dashboard/JobChecklist.jsx
import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Camera, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD_S  = '#c9a84c';

const JobChecklist = ({ bookingId, token, onReadyChange }) => {
  const [checklist, setChecklist] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(true);
  const [updating,  setUpdating]  = useState(null); // itemId being updated

  const load = async () => {
    try {
      // Try to get existing checklist
      let res  = await fetch(`${API_URL}/checklists/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If not found, init it first
      if (res.status === 404) {
        await fetch(`${API_URL}/checklists/booking/${bookingId}/init`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        res = await fetch(`${API_URL}/checklists/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const data = await res.json();
      if (data.success) {
        setChecklist(data.checklist);
        notifyReady(data.checklist);
      }
    } catch (err) {
      console.error('Checklist load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [bookingId, token]);

  const notifyReady = (cl) => {
    if (!cl) return;
    const missing = cl.items.filter(i => i.isRequired && !i.isCompleted);
    onReadyChange?.({ canComplete: missing.length === 0, missing });
  };

  const toggleItem = async (item) => {
    setUpdating(item.id);
    try {
      const endpoint = item.isCompleted
        ? `${API_URL}/checklists/item/${item.id}/uncomplete`
        : `${API_URL}/checklists/item/${item.id}/complete`;

      const res  = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setChecklist(prev => {
          const next = {
            ...prev,
            items: prev.items.map(i => i.id === item.id ? data.item : i),
          };
          notifyReady(next);
          return next;
        });
      }
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-3 px-4">
      <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD_S }} />
      <span className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>Loading checklist...</span>
    </div>
  );

  if (!checklist) return null;

  const total    = checklist.items.length;
  const done     = checklist.items.filter(i => i.isCompleted).length;
  const required = checklist.items.filter(i => i.isRequired && !i.isCompleted);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const canDone  = required.length === 0;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>

      {/* Header — toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <CheckSquare className="w-4 h-4" style={{ color: GOLD_S }} />
          <span className="text-white font-bold text-sm">Job Checklist</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: canDone ? 'rgba(52,211,153,0.12)' : 'rgba(201,168,76,0.1)',
              color: canDone ? '#34d399' : GOLD_S,
            }}>
            {done}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!canDone && (
            <span className="text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>
              {required.length} required left
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4" style={{ color:'rgba(255,255,255,0.4)' }} />
                : <ChevronDown className="w-4 h-4" style={{ color:'rgba(255,255,255,0.4)' }} />}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 mx-4 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: canDone
              ? 'linear-gradient(90deg,#34d399,#10b981)'
              : `linear-gradient(90deg,#c9a84c,#f5d376)`,
          }} />
      </div>

      {/* Items */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-2">
          {checklist.items.map(item => (
            <div key={item.id}
              className="flex items-start gap-3 py-2.5 px-3 rounded-xl transition-all"
              style={{
                background: item.isCompleted ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${item.isCompleted ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)'}`,
              }}>

              <button
                onClick={() => toggleItem(item)}
                disabled={!!updating}
                className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
              >
                {updating === item.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD_S }} />
                ) : item.isCompleted ? (
                  <CheckSquare className="w-5 h-5" style={{ color:'#34d399' }} />
                ) : (
                  <Square className="w-5 h-5" style={{ color: item.isRequired ? GOLD_S : 'rgba(255,255,255,0.3)' }} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <span className="text-sm leading-tight"
                  style={{
                    color: item.isCompleted ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)',
                    textDecoration: item.isCompleted ? 'line-through' : 'none',
                  }}>
                  {item.label}
                </span>

                <div className="flex items-center gap-2 mt-1">
                  {item.isRequired && !item.isCompleted && (
                    <span className="text-xs font-semibold" style={{ color: GOLD_S }}>Required</span>
                  )}
                  {item.requiresPhoto && !item.isCompleted && (
                    <span className="flex items-center gap-1 text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>
                      <Camera className="w-3 h-3" /> Photo needed
                    </span>
                  )}
                  {item.completedAt && (
                    <span className="text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>
                      {new Date(item.completedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Completion status */}
          {!canDone && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
              style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />
              <p className="text-xs" style={{ color:'rgba(255,255,255,0.7)' }}>
                Complete all required items before marking job done.
              </p>
            </div>
          )}

          {canDone && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
              style={{ background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)' }}>
              <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color:'#34d399' }} />
              <p className="text-xs" style={{ color:'#34d399' }}>
                All required items complete — job can be marked done.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobChecklist;
