import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const TimeSlotPicker = ({ selectedDate, selectedTime, onTimeSelect, businessConfig, className = '' }) => {
  const [slots, setSlots]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [validating, setValidating] = useState(false);
  const [validMsg, setValidMsg]     = useState('');
  const prevDateRef = useRef(null);

  // Fetch time slots for selected date
  useEffect(() => {
    if (!selectedDate || selectedDate === prevDateRef.current) return;
    prevDateRef.current = selectedDate;

    const load = async () => {
      setLoading(true);
      setValidMsg('');
      try {
        const res  = await fetch(
          `${import.meta.env.VITE_API_URL}/availability?startDate=${selectedDate}&endDate=${selectedDate}`
        );
        const data = await res.json();
        if (data.success && data.availability?.[0]) {
          const dayData = data.availability[0];
          setSlots(dayData.timeSlots || []);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  // Validate selected time slot
  useEffect(() => {
    if (!selectedDate || !selectedTime) { setValidMsg(''); return; }

    const validate = async () => {
      setValidating(true);
      try {
        const res  = await fetch(
          `${import.meta.env.VITE_API_URL}/availability/check?date=${selectedDate}&time=${encodeURIComponent(selectedTime)}`
        );
        const data = await res.json();
        if (data.available) {
          setValidMsg('confirmed');
        } else {
          setValidMsg(data.reason || 'Time slot no longer available');
          onTimeSelect?.('');
        }
      } catch {
        setValidMsg('');
      } finally {
        setValidating(false);
      }
    };
    validate();
  }, [selectedDate, selectedTime]);

  if (!selectedDate) {
    return (
      <div className={`rounded-2xl p-6 text-center ${className}`}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Clock className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Select a date to see available times</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 text-center ${className}`}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Loading available times...</p>
      </div>
    );
  }

  const availableSlots = slots.filter(s => s.available);

  if (availableSlots.length === 0) {
    return (
      <div className={`rounded-2xl p-6 text-center ${className}`}
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm font-semibold">No slots available</p>
        <p className="text-gray-500 text-xs mt-1">Please select a different date.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {availableSlots.map(slot => {
        const isSelected = selectedTime === slot.label;
        return (
          <button
            key={slot.id}
            onClick={() => onTimeSelect?.(slot.label)}
            className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-200 active:scale-98"
            style={{
              background: isSelected ? 'rgba(0,168,204,0.1)' : 'rgba(255,255,255,0.03)',
              border: isSelected ? '2px solid rgba(0,168,204,0.45)' : '2px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Radio */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: isSelected ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'transparent',
                  border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>

              <div>
                <div className="text-white font-bold text-base leading-tight">{slot.label}</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {slot.startHour}:00 — {slot.endHour}:00
                  {businessConfig?.serviceDuration && ` · ~${businessConfig.serviceDuration}h service`}
                </div>
              </div>
            </div>

            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{
                background: isSelected ? 'rgba(0,168,204,0.15)' : 'rgba(52,211,153,0.1)',
                color:      isSelected ? '#00d4ff' : '#34d399',
              }}
            >
              {isSelected ? 'Selected' : 'Available'}
            </span>
          </button>
        );
      })}

      {/* Validation feedback */}
      {(validating || validMsg) && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{
            background: validating || validMsg === 'confirmed'
              ? 'rgba(52,211,153,0.07)'
              : 'rgba(245,158,11,0.07)',
            border: validating || validMsg === 'confirmed'
              ? '1px solid rgba(52,211,153,0.2)'
              : '1px solid rgba(245,158,11,0.2)',
          }}
        >
          {validating
            ? <Loader2 className="w-4 h-4 animate-spin text-green-400 flex-shrink-0" />
            : validMsg === 'confirmed'
              ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
          <span style={{ color: validating || validMsg === 'confirmed' ? '#34d399' : '#fbbf24' }}>
            {validating ? 'Confirming availability...' : validMsg === 'confirmed' ? 'Time slot confirmed' : validMsg}
          </span>
        </div>
      )}

      {/* Business info */}
      {businessConfig?.operatingHours && (
        <div className="flex items-center gap-2 pt-1">
          <Clock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          <span className="text-gray-600 text-xs">
            Operating {businessConfig.operatingHours.start}:00 — {businessConfig.operatingHours.end}:00
            {businessConfig.minAdvanceHours && ` · ${businessConfig.minAdvanceHours}h min notice`}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
