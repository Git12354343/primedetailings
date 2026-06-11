/**
 * ConvertModal.jsx  (replacement for the inline convert modal inside AdminQuoteManager.jsx)
 *
 * HOW TO USE:
 *   In AdminQuoteManager.jsx, find the ConvertModal component definition
 *   (the function or const that renders the "Convert to Booking" dialog).
 *   Replace the entire ConvertModal definition with this file's export.
 *
 * Changes from original:
 *  - <input type="time"> → AvailabilityCalendar + TimeSlotPicker
 *    (admin picks from the exact same slots customers see)
 *  - Sends slotId in the API call (not a free-form "14:30" time string)
 *  - Shows conflict warning + override checkbox when API returns 409
 *  - On success, shows the slotId + confirmation code
 */

import React, { useState } from 'react';
import { Loader2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import AvailabilityCalendar from '../AvailabilityCalendar';
import TimeSlotPicker       from '../TimeSlotPicker';

const API   = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const iStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px', color: '#fff',
  padding: '8px 12px', fontSize: '13px',
  outline: 'none', width: '100%',
};

/**
 * @param {{ quote: object, adminToken: string, onClose: ()=>void, onDone: (code:string)=>void }} props
 */
const ConvertModal = ({ quote, adminToken, onClose, onDone }) => {
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('');  // display label e.g. "8:00 AM"
  const [slotId,      setSlotId]      = useState('');  // stable id e.g. "morning"
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [conflict,    setConflict]    = useState(null); // { message, conflictCode }
  const [override,    setOverride]    = useState(false);
  const [businessCfg, setBusinessCfg] = useState(null);

  // Load business config once for the pickers
  React.useEffect(() => {
    fetch(`${API}/availability/config`)
      .then(r => r.json())
      .then(d => { if (d.success) setBusinessCfg(d.config); })
      .catch(() => {});
  }, []);

  const handleDateSelect = (d) => {
    setDate(d);
    setTime('');
    setSlotId('');
    setConflict(null);
    setError('');
    setOverride(false);
  };

  const handleTimeSelect = (label, id) => {
    // TimeSlotPicker calls onTimeSelect(slot.label) — we also need the id.
    // If the picker passes the slot object, use it; otherwise derive from config.
    setTime(label);
    if (id) {
      setSlotId(id);
    } else if (businessCfg?.timeSlots) {
      const slot = businessCfg.timeSlots.find(s => s.label === label);
      setSlotId(slot?.id || '');
    }
    setConflict(null);
    setError('');
    setOverride(false);
  };

  const convert = async () => {
    if (!date)   { setError('Please select a date.'); return; }
    if (!slotId) { setError('Please select a time slot.'); return; }

    setLoading(true); setError(''); setConflict(null);
    try {
      const res  = await fetch(`${API}/quotes/admin/${quote.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminToken },
        body: JSON.stringify({ date, time, slotId, override }),
      });
      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        // Slot is occupied — show override option
        setConflict({ message: data.message, conflictCode: data.conflictCode });
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) throw new Error(data.message || 'Conversion failed');

      onDone(data.confirmationCode);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const canConvert = date && slotId && (!conflict || override);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-y-auto"
        style={{ background: '#111827', border: '1px solid rgba(0,168,204,0.25)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold text-lg">Convert to Booking</h3>
          <p className="text-gray-500 text-sm mt-0.5">Pick the appointment date and time slot.</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">

          {/* Date picker */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1" /> Date
            </label>
            <AvailabilityCalendar
              selectedDate={date}
              businessConfig={businessCfg}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Time slot picker */}
          {date && (
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">
                Time Slot
              </label>
              <TimeSlotPicker
                selectedDate={date}
                selectedTime={time}
                businessConfig={businessCfg}
                onTimeSelect={(label) => handleTimeSelect(label)}
              />
            </div>
          )}

          {/* Conflict warning */}
          {conflict && (
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-300 text-sm font-semibold">Slot conflict</p>
                  <p className="text-red-400 text-xs mt-0.5">{conflict.message}</p>
                  {conflict.conflictCode && (
                    <p className="text-gray-500 text-xs mt-1">
                      Conflicting booking: <span className="font-mono text-amber-400">{conflict.conflictCode}</span>
                    </p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={e => setOverride(e.target.checked)}
                  className="w-4 h-4 accent-amber-400"
                />
                <span className="text-amber-300 text-sm">
                  Override conflict — create booking anyway (this will be logged)
                </span>
              </label>
            </div>
          )}

          {/* General error */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button
            onClick={convert}
            disabled={loading || !canConvert}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0b0f1a] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)' }}>
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              : (override ? '⚠ Override & Convert' : 'Convert to Booking')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertModal;
