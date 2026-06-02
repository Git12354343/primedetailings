// src/components/admin/AdminWeatherAlerts.jsx — shown inside LiveJobFeed or as standalone panel
import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const WeatherBanner = ({ adminToken }) => {
  const [alert,    setAlert]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [dismissed,setDismissed]= useState(false);

  useEffect(() => {
    fetch(`${API}/audit/weather`, { headers:{ 'x-admin-secret': adminToken } })
      .then(r => r.json())
      .then(d => { if (d.success) setAlert(d.alert); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  if (loading || !alert || dismissed) return null;

  const hasAlerts = alert.alerts?.length > 0;
  if (!hasAlerts) return null;

  const isToday = alert.date === new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const icons = alert.alerts.map(a => a.icon).join(' ');

  return (
    <div className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)' }}>
      <span className="text-xl flex-shrink-0 mt-0.5">{icons}</span>
      <div className="flex-1">
        <p className="text-amber-300 font-bold text-sm">Weather Alert — Tomorrow's Jobs</p>
        <p className="text-amber-200/70 text-xs mt-0.5">
          {alert.alerts.map(a => a.desc || a.type).join(', ')} expected in {alert.city}.
          {alert.temp !== undefined ? ` ~${Math.round(alert.temp)}°C.` : ''}{' '}
          {alert.bookingCount > 0 ? `${alert.bookingCount} booking${alert.bookingCount > 1 ? 's' : ''} affected.` : ''}
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-300/50 hover:text-amber-300 text-xs">✕</button>
    </div>
  );
};

export default WeatherBanner;
