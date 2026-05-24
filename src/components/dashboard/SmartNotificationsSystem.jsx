import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, CheckCircle, AlertTriangle, X, Settings, Volume2, VolumeX, Navigation } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

const TYPE_CONFIG = {
  success:    { color: '#34d399', bg: 'rgba(52,211,153,0.08)',    border: 'rgba(52,211,153,0.2)' },
  warning:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',    border: 'rgba(245,158,11,0.2)' },
  error:      { color: '#f87171', bg: 'rgba(248,113,113,0.08)',   border: 'rgba(248,113,113,0.2)' },
  info:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',    border: 'rgba(96,165,250,0.2)' },
  assignment: { color: GOLD_S,   bg: 'rgba(201,168,76,0.08)',    border: 'rgba(201,168,76,0.25)' },
};

let _id = 0;
const uid = () => `n_${++_id}`;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ notification, onDismiss, onAction }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;

  useEffect(() => {
    setTimeout(() => setVisible(true), 20);
    if (notification.autoDismiss !== false) {
      const t = setTimeout(() => dismiss(), notification.duration || 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 280);
  };

  return (
    <div className="mb-3"
      style={{
        transform: visible && !exiting ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
        maxWidth: '360px',
        width: '100%',
      }}>
      <div className="rounded-2xl p-4 shadow-xl"
        style={{ background: 'rgba(18,18,18,0.97)', border: `1px solid ${cfg.border}`, backdropFilter: 'blur(20px)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg }}>
            {notification.type === 'success'    && <CheckCircle className="w-4 h-4" style={{ color: cfg.color }} />}
            {notification.type === 'warning'    && <AlertTriangle className="w-4 h-4" style={{ color: cfg.color }} />}
            {notification.type === 'assignment' && <Bell className="w-4 h-4" style={{ color: cfg.color }} />}
            {(notification.type === 'info' || notification.type === 'error') && <Bell className="w-4 h-4" style={{ color: cfg.color }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-0.5">{notification.title}</p>
            <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>{notification.message}</p>
            {notification.metadata?.address && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{notification.metadata.address}</p>
            )}
            {notification.actions?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {notification.actions.map((action, i) => (
                  <button key={i}
                    onClick={() => { onAction(notification.id, action); if (!notification.persistent) dismiss(); }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    style={action.style === 'primary'
                      ? { background: GOLD, color: '#0a0a0a' }
                      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main system ───────────────────────────────────────────────────────────────
const SmartNotificationsSystem = ({ jobs = [], onJobAction, userRole = 'detailer' }) => {
  const [notifications, setNotifications] = useState([]);
  const [showSettings, setShowSettings]   = useState(false);
  const [settings, setSettings] = useState({
    sound: true, jobAssignments: true, completions: true, delays: true,
  });
  const lastJobsRef = useRef(new Map());
  const seenAlertsRef = useRef(new Set());

  const addNotification = useCallback((n) => {
    setNotifications(p => [...p, { ...n, id: uid(), autoDismiss: !n.persistent }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(p => p.filter(n => n.id !== id));
  }, []);

  const handleAction = useCallback((notifId, action) => {
    if (onJobAction && action.jobId) onJobAction(action.jobId, action.type, action.data);
  }, [onJobAction]);

  // Watch for status changes and delays
  useEffect(() => {
    jobs.forEach(job => {
      const prev = lastJobsRef.current.get(job.id);
      if (!prev) { lastJobsRef.current.set(job.id, job); return; }

      if (prev.status !== job.status) {
        if (userRole === 'detailer' && !prev.detailerId && job.status === 'CONFIRMED' && settings.jobAssignments) {
          addNotification({
            type: 'assignment', title: 'New Job Assigned!',
            message: `${job.customer?.firstName} ${job.customer?.lastName}`,
            metadata: { address: `${job.customer?.address}, ${job.customer?.city}`, time: job.time },
            actions: [
              { label: 'Get Directions', style: 'primary', type: 'navigate', jobId: job.id },
              { label: 'View Job', type: 'view', jobId: job.id },
            ],
            persistent: true,
          });
        }
        if (userRole === 'admin' && job.status === 'COMPLETED' && settings.completions) {
          addNotification({
            type: 'success', title: 'Job Completed',
            message: `${job.detailer?.name || 'Detailer'} completed job for ${job.customer?.firstName} ${job.customer?.lastName}`,
          });
        }
      }

      // Delay check
      if (settings.delays && job.status === 'CONFIRMED') {
        const alertKey = `${job.id}_delay`;
        const apptTime = new Date(`${job.date} ${job.time}`);
        if (!seenAlertsRef.current.has(alertKey) && Date.now() > apptTime.getTime() + 15 * 60 * 1000) {
          seenAlertsRef.current.add(alertKey);
          addNotification({
            type: 'warning',
            title: userRole === 'detailer' ? 'Running Late' : 'Job Delayed',
            message: userRole === 'detailer'
              ? `You're 15+ min late for ${job.customer?.firstName}'s appointment`
              : `${job.detailer?.name || 'Detailer'} is late for ${job.customer?.firstName} ${job.customer?.lastName}`,
            actions: userRole === 'detailer'
              ? [{ label: 'Mark En Route', style: 'primary', type: 'status', jobId: job.id, data: { status: 'EN_ROUTE' } }]
              : [{ label: 'Contact Detailer', style: 'primary', type: 'contact', jobId: job.id }],
            duration: 10000,
          });
        }
      }

      lastJobsRef.current.set(job.id, job);
    });
  }, [jobs, settings, userRole, addNotification]);

  const toggleSetting = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  return (
    <>
      {/* Toast container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col items-end" style={{ maxWidth: '360px', width: 'calc(100vw - 2rem)' }}>
        {notifications.map(n => (
          <Toast key={n.id} notification={n} onDismiss={removeNotification} onAction={handleAction} />
        ))}
      </div>

      {/* Bell button */}
      <button onClick={() => setShowSettings(s => !s)}
        className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xl"
        style={{ background: 'rgba(18,18,18,0.95)', border: '1px solid rgba(201,168,76,0.25)', backdropFilter: 'blur(12px)' }}
        aria-label="Notification settings">
        <Bell className="w-4 h-4" style={{ color: GOLD_S }} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center text-black"
            style={{ background: GOLD }}>
            {notifications.length}
          </span>
        )}
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed bottom-36 right-4 z-50 w-64 rounded-2xl p-4 shadow-2xl"
          style={{ background: 'rgba(18,18,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Notifications</p>
            <button onClick={() => setShowSettings(false)}>
              <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { key: 'sound', label: 'Sound', icon: settings.sound ? Volume2 : VolumeX },
              { key: 'jobAssignments', label: 'Job assignments', icon: Bell },
              { key: 'completions', label: 'Completions', icon: CheckCircle },
              { key: 'delays', label: 'Delay alerts', icon: AlertTriangle },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-xs text-white">{label}</span>
                </div>
                <button onClick={() => toggleSetting(key)}
                  className="w-8 h-4.5 rounded-full relative transition-all"
                  style={{
                    background: settings[key] ? GOLD : 'rgba(255,255,255,0.15)',
                    width: '32px', height: '18px',
                  }}>
                  <span className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform"
                    style={{ transform: settings[key] ? 'translateX(14px)' : 'translateX(2px)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SmartNotificationsSystem;
