// src/components/admin/AdminStatsPro.jsx
// Polished replacement for AdminStats. Same props, nicer cards with icons,
// semantic color accents, and a highlighted "unassigned" alert state.
import React from 'react';
import { Briefcase, Zap, AlertCircle, Users, Settings } from 'lucide-react';

const Card = ({ label, value, Icon, color, alert }) => (
  <div className="rounded-xl p-4"
    style={{
      background: alert ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${alert ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
    }}>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10.5px] uppercase tracking-wider" style={{ color: alert ? '#a16207' : '#71717a' }}>{label}</span>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div className="text-2xl font-black" style={{ color: alert ? '#f59e0b' : '#fff' }}>{value}</div>
  </div>
);

const AdminStatsPro = ({ unassignedCount = 0, detailersCount = 0, totalJobs = 0, activeJobs = 0, servicesCount = 0 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
    <Card label="Total Jobs"  value={totalJobs}       Icon={Briefcase} color="#60a5fa" />
    <Card label="Active Now"  value={activeJobs}      Icon={Zap}       color="#34d399" />
    <Card label="Unassigned"  value={unassignedCount} Icon={AlertCircle} color="#f59e0b" alert={unassignedCount > 0} />
    <Card label="Detailers"   value={detailersCount}  Icon={Users}     color="#f5d376" />
    <Card label="Services"    value={servicesCount}   Icon={Settings}  color="#a78bfa" />
  </div>
);

export default AdminStatsPro;
