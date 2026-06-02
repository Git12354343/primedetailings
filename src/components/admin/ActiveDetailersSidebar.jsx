import React from 'react';
import { Users, Circle } from 'lucide-react';

const GOLD_S = '#00a8cc';

const statusConfig = (activeBookings) => {
  if (activeBookings === 0) return { label: 'Available', color: '#34d399', bg: 'rgba(52,211,153,0.1)', dot: '#34d399' };
  if (activeBookings <= 2)  return { label: 'Busy',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' };
  return                           { label: 'Very Busy', color: '#f87171', bg: 'rgba(248,113,113,0.1)', dot: '#f87171' };
};

const ActiveDetailersSidebar = ({ detailers = [] }) => {
  const safeDetailers = Array.isArray(detailers) ? detailers : [];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Users className="w-4 h-4" style={{ color: GOLD_S }} />
        <span className="text-sm font-bold text-white">Active Detailers</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(0,168,204,0.12)', color: GOLD_S }}>
          {safeDetailers.length}
        </span>
      </div>

      {/* List */}
      <div className="divide-y overflow-y-auto" style={{ maxHeight: '420px', divideColor: 'rgba(255,255,255,0.05)' }}>
        {safeDetailers.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No detailers yet</p>
          </div>
        ) : (
          safeDetailers.map(d => {
            const s = statusConfig(d.activeBookings || 0);
            const initials = (d.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(0,168,204,0.12)', color: GOLD_S }}>
                    {initials}
                  </div>
                  {/* Status dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: s.dot, borderColor: '#0b0f1a' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{d.name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{d.email}</p>
                </div>

                {/* Status + count */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: GOLD_S }}>
                    {d.activeBookings || 0} job{d.activeBookings !== 1 ? 's' : ''}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActiveDetailersSidebar;
