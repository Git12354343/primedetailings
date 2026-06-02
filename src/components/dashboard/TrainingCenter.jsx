// src/components/dashboard/TrainingCenter.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Star, Lock, ChevronRight, Award, Loader2 } from 'lucide-react';
import TrainingModuleViewer from './TrainingModuleViewer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD_S  = '#00a8cc';

const CATEGORY_LABELS = {
  GENERAL:               'General',
  SERVICE_PROCEDURE:     'Procedures',
  PRODUCT_USAGE:         'Products',
  SAFETY:                'Safety',
  CERAMIC_COATING:       'Ceramic',
  CUSTOMER_COMMUNICATION:'Communication',
  PHOTO_STANDARDS:       'Photos',
  JOB_WORKFLOW:          'Workflow',
};

const LEVEL_COLORS = {
  BEGINNER:     '#34d399',
  INTERMEDIATE: '#00a8cc',
  ADVANCED:     '#f97316',
};

const TrainingCenter = ({ token }) => {
  const [modules,  setModules]  = useState([]);
  const [progress, setProgress] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [active,   setActive]   = useState(null); // moduleId being viewed

  useEffect(() => {
    const load = async () => {
      try {
        const [modRes, progRes] = await Promise.all([
          fetch(`${API_URL}/training/modules`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/training/progress`,  { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const modData  = await modRes.json();
        const progData = await progRes.json();

        if (modData.success)  setModules(modData.modules);
        if (progData.success) {
          const map = {};
          progData.progress.forEach(p => { map[p.moduleId] = p; });
          setProgress(map);
        }
      } catch (err) {
        console.error('Training load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const completed  = modules.filter(m => progress[m.id]?.status === 'COMPLETED').length;
  const required   = modules.filter(m => m.isRequired).length;
  const reqDone    = modules.filter(m => m.isRequired && progress[m.id]?.status === 'COMPLETED').length;

  if (active) return (
    <TrainingModuleViewer
      moduleId={active}
      token={token}
      progress={progress[active]}
      onBack={() => setActive(null)}
      onComplete={(moduleId, result) => {
        setProgress(prev => ({ ...prev, [moduleId]: { ...prev[moduleId], ...result } }));
        setActive(null);
      }}
    />
  );

  return (
    <div className="p-4 sm:p-6">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white mb-1">Formation Center</h2>
        <p className="text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>
          Complete required modules before your first job.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label:'Completed',       value:`${completed}/${modules.length}`, color:'#34d399' },
            { label:'Required Done',   value:`${reqDone}/${required}`,         color: GOLD_S },
            { label:'Total Minutes',   value:`${modules.reduce((a,m) => a+(m.estimatedMinutes||0), 0)}m`, color:'#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color:'rgba(255,255,255,0.45)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Required modules banner */}
      {reqDone < required && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6"
          style={{ background:'rgba(0,168,204,0.08)', border:'1px solid rgba(0,168,204,0.2)' }}>
          <Star className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_S }} />
          <p className="text-sm" style={{ color:'rgba(255,255,255,0.8)' }}>
            <span className="font-bold text-white">{required - reqDone} required module{required-reqDone > 1 ? 's' : ''}</span> left to complete before taking jobs.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map(module => {
            const prog    = progress[module.id];
            const isDone  = prog?.status === 'COMPLETED';
            const started = prog?.status === 'IN_PROGRESS';

            return (
              <button key={module.id} onClick={() => setActive(module.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: isDone ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isDone ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`,
                }}>

                {/* Status icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isDone ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)' }}>
                  {isDone
                    ? <CheckCircle className="w-5 h-5" style={{ color:'#34d399' }} />
                    : <BookOpen className="w-5 h-5" style={{ color: started ? GOLD_S : 'rgba(255,255,255,0.4)' }} />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-bold text-sm truncate">{module.title}</span>
                    {module.isRequired && !isDone && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background:'rgba(0,168,204,0.15)', color: GOLD_S }}>Required</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background:`${LEVEL_COLORS[module.level]}15`, color: LEVEL_COLORS[module.level] }}>
                      {module.level}
                    </span>
                    <span className="text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>
                      {CATEGORY_LABELS[module.category] || module.category}
                    </span>
                    {module.estimatedMinutes && (
                      <span className="text-xs flex items-center gap-1" style={{ color:'rgba(255,255,255,0.35)' }}>
                        <Clock className="w-3 h-3" />{module.estimatedMinutes}m
                      </span>
                    )}
                    {isDone && prog?.score !== null && prog?.score !== undefined && (
                      <span className="text-xs font-bold" style={{ color:'#34d399' }}>
                        Score: {prog.score}%
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color:'rgba(255,255,255,0.3)' }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainingCenter;
