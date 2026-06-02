import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Camera, Loader2, AlertCircle } from 'lucide-react';

const GOLD = 'linear-gradient(135deg, #00a8cc, #00d4ff)';
const GOLD_S = '#00a8cc';
const FILTERS = ['All', 'Full Detail', 'Interior', 'Exterior', 'Ceramic Coat', 'Paint Correction', 'Engine Bay'];

// ── Drag-reveal card ──────────────────────────────────────────────────────────
const RevealCard = ({ photo }) => {
  const [pos, setPos]         = useState(50);
  const [dragging, setDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState({ before: false, after: !photo.afterUrl });
  const cardRef = useRef(null);

  const getPos = useCallback((clientX) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseMove = useCallback((e) => { if (dragging) setPos(getPos(e.clientX)); }, [dragging, getPos]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      const up = () => setDragging(false);
      window.addEventListener('mouseup', up);
      return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', up); };
    }
  }, [dragging, onMouseMove]);

  const bothLoaded = imgLoaded.before && imgLoaded.after;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Reveal area */}
      <div ref={cardRef}
        className="relative select-none overflow-hidden"
        style={{ aspectRatio: '16/9', cursor: photo.afterUrl ? 'col-resize' : 'default' }}
        onMouseDown={() => photo.afterUrl && setDragging(true)}
        onTouchStart={() => photo.afterUrl && setDragging(true)}
        onTouchMove={e => { e.preventDefault(); photo.afterUrl && setPos(getPos(e.touches[0].clientX)); }}
        onTouchEnd={() => setDragging(false)}>

        {/* Shimmer while loading */}
        {!bothLoaded && (
          <div className="absolute inset-0 z-20 animate-pulse"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg,rgba(255,255,255,0.02) 0%,rgba(255,255,255,0.05) 50%,rgba(255,255,255,0.02) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          </div>
        )}

        {/* AFTER / single image */}
        <img src={photo.afterUrl || photo.beforeUrl} alt="After" loading="lazy" decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => setImgLoaded(p => ({ ...p, after: true }))} />

        {/* BEFORE clipped */}
        {photo.afterUrl && (
          <>
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img src={photo.beforeUrl} alt="Before" loading="lazy" decoding="async"
                className="absolute inset-0 h-full object-cover"
                style={{ width: `${100 / (pos / 100)}%`, maxWidth: 'none' }}
                onLoad={() => setImgLoaded(p => ({ ...p, before: true }))} />
            </div>
            {/* Labels */}
            <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(6px)', opacity: pos > 18 ? 1 : 0, transition: 'opacity 0.2s' }}>
              Before
            </div>
            <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', color: GOLD_S, backdropFilter: 'blur(6px)', opacity: pos < 82 ? 1 : 0, transition: 'opacity 0.2s' }}>
              After
            </div>
            {/* Gold divider */}
            <div className="absolute top-0 bottom-0 z-10 w-0.5 pointer-events-none"
              style={{ left: `${pos}%`, background: GOLD, boxShadow: '0 0 12px rgba(0,168,204,0.7)' }}>
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: GOLD, boxShadow: '0 0 16px rgba(0,168,204,0.6)', cursor: 'col-resize' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4 3l-3 4 3 4M10 3l3 4-3 4" stroke="#0b0f1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {/* Drag hint */}
            {!dragging && pos === 50 && bothLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(6px)' }}>
                  Drag to reveal
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-semibold">{photo.caption || photo.vehicle}</p>
          <span className="text-xs px-2 py-0.5 rounded-md font-medium mt-1 inline-block"
            style={{ background: 'rgba(0,168,204,0.1)', color: GOLD_S }}>
            {photo.serviceType}
          </span>
        </div>
        <Camera className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }} />
      </div>
    </div>
  );
};

// ── Main gallery page ─────────────────────────────────────────────────────────
const Gallery = () => {
  const [photos, setPhotos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/photos?limit=50`);
        const data = await res.json();
        if (data.success) setPhotos(data.photos);
        else setError('Failed to load gallery.');
      } catch { setError('Could not connect to server.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = activeFilter === 'All'
    ? photos
    : photos.filter(p => p.serviceType === activeFilter);

  return (
    <div className="min-h-screen" style={{ background: '#0b0f1a' }}>
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,168,204,0.3),transparent)' }} />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(0,168,204,0.03)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)', color: GOLD_S }}>
            <Camera className="w-3.5 h-3.5" /> Our Work
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-5">
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Before & After.
            </span>
            <br /><span className="text-white">The Proof Is in the Detail.</span>
          </h1>
          <p className="text-base max-w-xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Drag the gold divider on any card. Every result is real — no filters, no editing.
          </p>

          {/* Filter pills — only show categories that have photos */}
          {!loading && photos.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {FILTERS.filter(f => f === 'All' || photos.some(p => p.serviceType === f)).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={activeFilter === f
                    ? { background: GOLD, color: '#0b0f1a' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_S }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading gallery...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 rounded-xl max-w-md mx-auto"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-24">
            <Camera className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="text-xl font-bold text-white mb-2">Gallery coming soon</p>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
              We're building our portfolio. Check back soon — or book your own transformation.
            </p>
            <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black"
              style={{ background: GOLD }}>
              Be Our Next Success Story <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No {activeFilter} photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.map(photo => <RevealCard key={photo.id} photo={photo} />)}
          </div>
        )}
      </section>

      {/* Stats strip */}
      {!loading && photos.length > 0 && (
        <section className="border-y" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              [`${photos.length}+`, 'Jobs Documented'],
              ['4.9★', 'Average Rating'],
              ['100%', 'Satisfaction Rate'],
              ['All QC', 'Service Area'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-black mb-1" style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black text-white mb-4">Ready for Your Transformation?</h2>
        <p className="mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>Your vehicle deserves the same treatment. Book in under 3 minutes.</p>
        <Link to="/booking" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-black"
          style={{ background: GOLD, boxShadow: '0 0 30px rgba(0,168,204,0.3)' }}>
          Book Your Detail <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};

export default Gallery;
