import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity, Clock, MapPin, User, Wrench,
  Navigation, Play, CheckCircle, AlertTriangle,
  RefreshCw, Search
} from 'lucide-react';

const STATUS_CONFIG = {
  CONFIRMED:   { label: 'Confirmed',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   icon: User,       priority: 1 },
  EN_ROUTE:    { label: 'En Route',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  icon: Navigation, priority: 2 },
  STARTED:     { label: 'Started',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: Play,       priority: 3 },
  IN_PROGRESS: { label: 'In Progress', color: '#f97316', bg: 'rgba(249,115,22,0.12)',   icon: Activity,   priority: 4 },
  COMPLETED:   { label: 'Completed',   color: '#34d399', bg: 'rgba(52,211,153,0.12)',   icon: CheckCircle,priority: 5 },
  PENDING:     { label: 'Pending',     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',  icon: Clock,      priority: 0 },
  CANCELED:    { label: 'Cancelled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: AlertTriangle, priority: 6 },
};

const getStatusCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.CONFIRMED;

const LiveJobFeed = ({
  bookings = [],   // AdminDashboard passes "bookings"
  jobs,            // fallback alias
  onJobClick,
  onRefresh,
  refreshInterval = 30000,
  statusCounts: externalCounts,
}) => {
  // Accept either prop name
  const allJobs = jobs ?? bookings;

  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lastRefresh, setLastRefresh]   = useState(() => new Date());

  // Stable ref so the interval doesn't re-create on every render
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  // Auto-refresh — stable interval, never causes re-render loop
  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(() => {
      onRefreshRef.current?.();
      setLastRefresh(new Date());
    }, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval]); // only refreshInterval in deps — safe

  // Filtered jobs — memoized to avoid recompute on unrelated renders
  const filteredJobs = useMemo(() => {
    let result = allJobs;
    if (statusFilter !== 'ALL') result = result.filter(j => j.status === statusFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(j =>
        j.customer?.firstName?.toLowerCase().includes(t) ||
        j.customer?.lastName?.toLowerCase().includes(t)  ||
        j.customer?.address?.toLowerCase().includes(t)   ||
        j.vehicle?.make?.toLowerCase().includes(t)       ||
        j.vehicle?.model?.toLowerCase().includes(t)      ||
        j.confirmationCode?.toLowerCase().includes(t)
      );
    }
    return result;
  }, [allJobs, statusFilter, searchTerm]);

  const counts = useMemo(() => ({
    ALL:         allJobs.length,
    PENDING:     allJobs.filter(j => j.status === 'PENDING').length,
    CONFIRMED:   allJobs.filter(j => j.status === 'CONFIRMED').length,
    EN_ROUTE:    allJobs.filter(j => j.status === 'EN_ROUTE').length,
    STARTED:     allJobs.filter(j => j.status === 'STARTED').length,
    IN_PROGRESS: allJobs.filter(j => j.status === 'IN_PROGRESS').length,
    COMPLETED:   allJobs.filter(j => j.status === 'COMPLETED').length,
  }), [allJobs]);

  const handleRefresh = useCallback(() => {
    onRefreshRef.current?.();
    setLastRefresh(new Date());
  }, []);

  const isDelayed = useCallback((job) => {
    if (job.status === 'COMPLETED' || job.status === 'CANCELED') return false;
    try {
      const appt = new Date(`${job.date} ${job.time}`);
      return Date.now() > appt.getTime() + 15 * 60 * 1000 && job.status === 'CONFIRMED';
    } catch { return false; }
  }, []);

  const sortedGroups = useMemo(() => {
    const groups = filteredJobs.reduce((acc, job) => {
      if (!acc[job.status]) acc[job.status] = [];
      acc[job.status].push(job);
      return acc;
    }, {});
    return Object.entries(groups).sort(([a], [b]) =>
      getStatusCfg(a).priority - getStatusCfg(b).priority
    );
  }, [filteredJobs]);

  const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'EN_ROUTE', 'STARTED', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.15)' }}>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Live Job Feed</div>
            <div className="text-gray-500 text-xs">
              {filteredJobs.length} jobs · Updated {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <button onClick={handleRefresh}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Search + filters */}
      <div className="px-5 py-3 space-y-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-600"
            placeholder="Search by name, address, vehicle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map(s => {
            const cfg = s === 'ALL' ? null : getStatusCfg(s);
            const isActive = statusFilter === s;
            const count = counts[s] ?? 0;
            if (s !== 'ALL' && count === 0) return null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: isActive ? (cfg?.bg ?? 'rgba(201,168,76,0.15)') : 'rgba(255,255,255,0.04)',
                  border: isActive ? `1px solid ${cfg?.color ?? '#f5d376'}40` : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? (cfg?.color ?? '#f5d376') : '#6b7280',
                }}>
                {s === 'ALL' ? `All (${count})` : `${cfg.label} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Job list */}
      <div className="divide-y overflow-y-auto custom-scrollbar" style={{ maxHeight: '60vh', borderColor: 'rgba(255,255,255,0.06)' }}>
        {filteredJobs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {searchTerm || statusFilter !== 'ALL' ? 'No jobs match your filters.' : 'No jobs yet.'}
            </p>
          </div>
        ) : (
          sortedGroups.map(([status, statusJobs]) => {
            const cfg = getStatusCfg(status);
            const Icon = cfg.icon;
            return (
              <div key={status}>
                {/* Group header */}
                <div className="flex items-center gap-2 px-5 py-2"
                  style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                    {cfg.label} ({statusJobs.length})
                  </span>
                </div>

                {statusJobs.map(job => {
                  const delayed = isDelayed(job);
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={job.id}
                      onClick={() => onJobClick?.(job)}
                      className="px-5 py-4 cursor-pointer transition-all hover:bg-white/[0.03]"
                      style={delayed ? { borderLeft: '3px solid #ef4444' } : {}}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Status + delayed badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                            {delayed && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                                <AlertTriangle className="w-3 h-3" /> Delayed
                              </span>
                            )}
                          </div>

                          {/* Customer */}
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="text-white font-semibold text-sm truncate">
                              {job.customer?.firstName} {job.customer?.lastName}
                            </span>
                            <span className="text-gray-500 text-xs">#{job.confirmationCode}</span>
                          </div>

                          {/* Address */}
                          {job.customer?.address && (
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-400 text-xs truncate">
                                {job.customer.address}, {job.customer.city}
                              </span>
                            </div>
                          )}

                          {/* Vehicle */}
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-400 text-xs truncate">
                              {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                              {job.vehicle?.vehicleType && ` · ${job.vehicle.vehicleType}`}
                            </span>
                          </div>

                          {/* Services tags */}
                          {Array.isArray(job.services) && job.services.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {job.services.slice(0, 3).map((svc, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(96,165,250,0.1)', color: '#93c5fd' }}>
                                  {svc}
                                </span>
                              ))}
                              {job.services.length > 3 && (
                                <span className="text-xs px-2 py-0.5 rounded-full text-gray-500"
                                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                                  +{job.services.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right column */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {job.time}
                          </div>
                          {job.totalPrice && (
                            <div className="text-xs font-bold mb-1" style={{
                              background: 'linear-gradient(135deg, #c9a84c, #f5d376)',
                              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>
                              ${parseFloat(job.totalPrice).toFixed(0)}
                            </div>
                          )}
                          {job.detailer && (
                            <div className="text-xs text-gray-500">{job.detailer.name}</div>
                          )}
                          {status === 'IN_PROGRESS' && (
                            <div className="mt-2 flex justify-end">
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar for IN_PROGRESS */}
                      {status === 'IN_PROGRESS' && job.startedAt && (
                        <div className="mt-3">
                          <div className="w-full h-1 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(5,
                                  ((Date.now() - new Date(job.startedAt).getTime()) / (1000 * 60 * 90)) * 100
                                ))}%`,
                                background: 'linear-gradient(90deg, #f97316, #fb923c)',
                              }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live · refreshes every {refreshInterval / 1000}s
        </div>
        <div className="text-xs text-gray-500">
          {counts.IN_PROGRESS + counts.STARTED + counts.EN_ROUTE} active
          {filteredJobs.filter(j => isDelayed(j)).length > 0 && (
            <span className="text-red-400 ml-2">
              · {filteredJobs.filter(j => isDelayed(j)).length} delayed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveJobFeed;
