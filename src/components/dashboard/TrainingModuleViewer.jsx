// src/components/dashboard/TrainingModuleViewer.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOLD_S  = '#c9a84c';

// Minimal markdown renderer (bold, italic, headings, lists, code)
const renderMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gm,  '<h3 style="color:#fff;font-size:16px;font-weight:700;margin:20px 0 8px">$1</h3>')
    .replace(/^## (.*$)/gm,   '<h2 style="color:#fff;font-size:20px;font-weight:800;margin:24px 0 10px">$1</h2>')
    .replace(/^# (.*$)/gm,    '<h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 16px">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g,'<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/\*(.*?)\*/g,    '<em style="color:rgba(255,255,255,0.8)">$1</em>')
    .replace(/`(.*?)`/g,      '<code style="background:rgba(255,255,255,0.08);color:#f5d376;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/^- (.*$)/gm,    '<li style="color:rgba(255,255,255,0.75);margin:4px 0;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:8px 0 8px 16px;list-style:disc">$&</ul>')
    .replace(/\n\n/g,          '<br/><br/>')
    .replace(/\n/g,            '<br/>');
};

const TrainingModuleViewer = ({ moduleId, token, progress, onBack, onComplete }) => {
  const [module,    setModule]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [phase,     setPhase]     = useState('read'); // 'read' | 'quiz' | 'result'
  const [answers,   setAnswers]   = useState({});     // { quizId: selectedIdx }
  const [result,    setResult]    = useState(null);
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Mark started
        await fetch(`${API_URL}/training/progress/${moduleId}/start`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        const res  = await fetch(`${API_URL}/training/modules/${moduleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setModule(data.module);
      } catch (err) {
        devError.error('Module load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [moduleId, token]);

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/training/quiz/${moduleId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setPhase('result');
      }
    } catch (err) {
      devError.error('Quiz submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const markCompleteNoQuiz = async () => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/training/quiz/${moduleId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: {} }),
      });
      const data = await res.json();
      if (data.success) onComplete?.(moduleId, { status: 'COMPLETED', score: 100 });
    } catch (err) {
      devError.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
    </div>
  );

  if (!module) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Module not found.</p>
      <button onClick={onBack} className="mt-4 text-yellow-400 text-sm">← Back</button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">

      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color:'rgba(255,255,255,0.5)' }}
        onMouseEnter={e => e.currentTarget.style.color='#f5d376'}
        onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
        <ArrowLeft className="w-4 h-4" /> Back to Training
      </button>

      {/* ── READ PHASE ── */}
      {phase === 'read' && (
        <>
          <h1 className="text-2xl font-black text-white mb-2">{module.title}</h1>
          {module.description && (
            <p className="text-sm mb-6" style={{ color:'rgba(255,255,255,0.5)' }}>{module.description}</p>
          )}

          <div className="rounded-2xl p-6 mb-6"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div
              style={{ color:'rgba(255,255,255,0.75)', fontSize:'14px', lineHeight:'1.8' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(module.content) }}
            />
          </div>

          <div className="flex justify-end">
            {module.quizzes?.length > 0 ? (
              <button onClick={() => setPhase('quiz')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                style={{ background:`linear-gradient(135deg,#c9a84c,#f5d376)`, color:'#0a0a0a' }}>
                Take Quiz <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={markCompleteNoQuiz} disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background:`linear-gradient(135deg,#c9a84c,#f5d376)`, color:'#0a0a0a' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mark Complete
              </button>
            )}
          </div>
        </>
      )}

      {/* ── QUIZ PHASE ── */}
      {phase === 'quiz' && (
        <>
          <h2 className="text-xl font-black text-white mb-6">Quiz — {module.title}</h2>
          <div className="space-y-6 mb-8">
            {module.quizzes?.map((q, qi) => (
              <div key={q.id} className="rounded-2xl p-5"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white font-semibold text-sm mb-4">
                  {qi+1}. {q.question}
                </p>
                <div className="space-y-2">
                  {(Array.isArray(q.options) ? q.options : JSON.parse(q.options)).map((opt, oi) => (
                    <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: answers[q.id] === oi ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${answers[q.id] === oi ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: answers[q.id] === oi ? '#f5d376' : 'rgba(255,255,255,0.7)',
                      }}>
                      <span className="font-bold mr-2">{String.fromCharCode(65+oi)}.</span> {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={submitQuiz} disabled={submitting || Object.keys(answers).length < (module.quizzes?.length || 0)}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
            style={{ background:`linear-gradient(135deg,#c9a84c,#f5d376)`, color:'#0a0a0a' }}>
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </>
      )}

      {/* ── RESULT PHASE ── */}
      {phase === 'result' && result && (
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: result.passed ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${result.passed ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
            {result.passed
              ? <CheckCircle className="w-10 h-10" style={{ color:'#34d399' }} />
              : <XCircle    className="w-10 h-10" style={{ color:'#ef4444' }} />
            }
          </div>

          <h2 className="text-2xl font-black text-white mb-2">
            {result.passed ? '🎉 Passed!' : 'Not quite...'}
          </h2>
          <p className="text-4xl font-black mb-2" style={{ color: result.passed ? '#34d399' : '#ef4444' }}>
            {result.score}%
          </p>
          <p className="text-sm mb-8" style={{ color:'rgba(255,255,255,0.5)' }}>
            {result.passed ? 'Module complete!' : 'Score 70% or higher to pass. Review the module and try again.'}
          </p>

          {/* Answer review */}
          <div className="space-y-3 text-left mb-8">
            {result.results?.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  background: r.isCorrect ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${r.isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                {r.isCorrect
                  ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color:'#34d399' }} />
                  : <XCircle    className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color:'#ef4444' }} />
                }
                <div>
                  {r.explanation && (
                    <p className="text-xs mt-1" style={{ color:'rgba(255,255,255,0.55)' }}>{r.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result.passed ? (
            <button onClick={() => onComplete?.(moduleId, { status:'COMPLETED', score: result.score })}
              className="px-8 py-3 rounded-xl text-sm font-bold"
              style={{ background:`linear-gradient(135deg,#c9a84c,#f5d376)`, color:'#0a0a0a' }}>
              Back to Training
            </button>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setPhase('read'); setAnswers({}); setResult(null); }}
                className="px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.1)' }}>
                Review Module
              </button>
              <button onClick={() => { setPhase('quiz'); setAnswers({}); setResult(null); }}
                className="px-6 py-3 rounded-xl text-sm font-bold"
                style={{ background:`linear-gradient(135deg,#c9a84c,#f5d376)`, color:'#0a0a0a' }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainingModuleViewer;
