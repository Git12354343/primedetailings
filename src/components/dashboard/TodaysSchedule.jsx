// src/components/dashboard/TodaysSchedule.jsx
import React from 'react';
import { Calendar, MapPin, Car } from 'lucide-react';

const GOLD_S = '#c9a84c';

const STATUS_STYLE = {
  COMPLETED:   { bg: 'rgba(52,211,153,0.1)',  color: '#34d399' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  STARTED:     { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  EN_ROUTE:    { bg: 'rgba(96,165,250,0.1)',  color: '#60a5fa' },
  CONFIRMED:   { bg: 'rgba(201,168,76,0.08)', color: '#c9a84c' },
};

const TodaysSchedule = ({ todayBookings }) => {
  if (!todayBookings || todayBookings.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden mb-6"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(201,168,76,0.04)' }}>
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4" style={{ color: GOLD_S }} />
          <h3 className="font-bold text-white text-sm">Today's Schedule</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.15)', color: GOLD_S }}>
            {todayBookings.length} {todayBookings.length === 1 ? 'job' : 'jobs'}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
        {todayBookings.map((booking) => {
          const s = STATUS_STYLE[booking.status] || STATUS_STYLE.CONFIRMED;
          return (
            <div key={booking.id} className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {/* Time */}
              <div className="w-14 text-center flex-shrink-0">
                <p className="text-xs font-black text-white">{booking.time}</p>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {booking.customer?.firstName} {booking.customer?.lastName}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Car className="w-3 h-3" />
                    {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                  </span>
                  {booking.customer?.address && (
                    <span className="flex items-center gap-1 text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {booking.customer.city || booking.customer.address}
                    </span>
                  )}
                </div>
              </div>
              {/* Status badge */}
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: s.bg, color: s.color }}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodaysSchedule;
