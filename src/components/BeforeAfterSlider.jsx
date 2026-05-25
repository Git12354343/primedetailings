// src/components/BeforeAfterSlider.jsx
// "See the Difference" — cinematic before/after gallery section
// Fetches real photos from /api/photos. Falls back to demo cards if empty.
// Design: dark stage, gold accents, horizontal scroll carousel,
// each card has a drag-to-reveal before/after comparison.
// Auto-advances every 5 s, pauses on hover/touch.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import useInView from '../hooks/useInView';

const GOLD   = 'linear-gradient(135deg,#c9a84c,#f5d376)';
const GOLD_S = '#c9a84c';

/* ── Demo cards shown when no real photos exist yet ──────────────────── */
const DEMO = [
  {
    id: 'd1',
    beforeUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80',
    afterUrl:  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    caption: 'Full Exterior Detail',
    vehicle: 'BMW 3 Series',
    serviceType: 'Paint Correction',
  },
  {
    id: 'd2',
    beforeUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
    afterUrl:  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80',
    caption: 'Ceramic Coating',
    vehicle: 'Mercedes C-Class',
    serviceType: 'Ceramic Coating',
  },
  {
    id: 'd3',
    beforeUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=900&q=80',
    afterUrl:  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80',
    caption: 'Interior Revival',
    vehicle: 'Audi Q5',
    serviceType: 'Interior Detail',
  },
  {
    id: 'd4',
    beforeUrl: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&w=900&q=80',
    afterUrl:  'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=900&q=80',
    caption: 'Deep Clean & Polish',
    vehicle: 'Porsche Cayenne',
    serviceType: 'Full Detail',
  },
  {
    id: 'd5',
    beforeUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80',
    afterUrl:  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=900&q=80',
    caption: 'Swirl Removal',
    vehicle: 'Tesla Model 3',
    serviceType: 'Paint Correction',
  },
];

/* ── Single before/after drag card ──────────────────────────────────── */
const CompareCard = ({ photo, isActive }) => {
  const [pos, setPos]     = useState(50);
  const [drag, setDrag]   = useState(false);
  const [hinted, setHinted] = useState(false);
  const boxRef            = useRef(null);

  // Reset position when card becomes active
  useEffect(() => { if (isActive) { setPos(50); setHinted(false); } }, [isActive]);

  // Auto-animate hint on first activation
  useEffect(() => {
    if (!isActive || hinted) return;
    const t1 = setTimeout(() => setPos(30), 600);
    const t2 = setTimeout(() => setPos(70), 1100);
    const t3 = setTimeout(() => { setPos(50); setHinted(true); }, 1600);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [isActive, hinted]);

  const getX = useCallback((clientX) => {
    if (!boxRef.current) return 50;
    const r = boxRef.current.getBoundingClientRect();
    return Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100));
  }, []);

  const onMouseMove  = useCallback(e => { if (drag) setPos(getX(e.clientX)); }, [drag, getX]);
  const onTouchMove  = useCallback(e => { e.preventDefault(); setPos(getX(e.touches[0].clientX)); }, [getX]);

  const hasAfter = !!photo.afterUrl;

  return (
    <div className="relative w-full h-full select-none overflow-hidden"
      ref={boxRef}
      style={{ cursor: hasAfter ? (drag ? 'col-resize' : 'grab') : 'default' }}
      onMouseDown={() => hasAfter && setDrag(true)}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDrag(false)}
      onMouseLeave={() => setDrag(false)}
      onTouchStart={() => hasAfter && setDrag(true)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => setDrag(false)}>

      {/* AFTER (base layer) */}
      <img
        src={photo.afterUrl || photo.beforeUrl}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        draggable="false"
      />

      {/* Subtle shimmer on after side */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(120deg,transparent 30%,rgba(201,168,76,0.06) 50%,transparent 70%)',
          animation: 'shimmerShift 4s ease-in-out infinite',
        }} />

      {/* BEFORE (clipped) */}
      {hasAfter && (
        <div className="absolute inset-0 overflow-hidden"
          style={{ width: `${pos}%`, transition: drag ? 'none' : 'width 0.35s cubic-bezier(.4,0,.2,1)' }}>
          <img
            src={photo.beforeUrl}
            alt="Before"
            className="absolute inset-0 h-full object-cover"
            style={{ width: `${10000 / pos}%`, maxWidth: 'none' }}
            draggable="false"
          />
          {/* Desaturate before side slightly */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)', mixBlendMode: 'multiply' }} />
        </div>
      )}

      {/* Divider line */}
      {hasAfter && (
        <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{
            left: `${pos}%`,
            width: '2px',
            background: 'linear-gradient(180deg,transparent,#f5d376,#c9a84c,#f5d376,transparent)',
            boxShadow: '0 0 12px rgba(201,168,76,0.8), 0 0 32px rgba(201,168,76,0.3)',
            transition: drag ? 'none' : 'left 0.35s cubic-bezier(.4,0,.2,1)',
          }}>
          {/* Handle */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#c9a84c,#f5d376)',
              boxShadow: '0 0 0 3px rgba(0,0,0,0.4), 0 0 20px rgba(201,168,76,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'col-resize',
              pointerEvents: 'all',
            }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M4 1L1 5l3 4M12 1l3 4-3 4" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* BEFORE label */}
      {hasAfter && (
        <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)',
            opacity: pos > 15 ? 1 : 0, transition: 'opacity 0.2s',
          }}>
          BEFORE
        </div>
      )}

      {/* AFTER label */}
      {hasAfter && (
        <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.55)', color: GOLD_S,
            opacity: pos < 85 ? 1 : 0, transition: 'opacity 0.2s',
          }}>
          AFTER
        </div>
      )}

      {/* Bottom gradient + info */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-4 pt-10"
        style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 100%)' }}>
        <p className="text-white font-bold text-sm leading-tight">{photo.caption || photo.vehicle}</p>
        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(201,168,76,0.2)', color: GOLD_S, border: '1px solid rgba(201,168,76,0.3)' }}>
          {photo.serviceType}
        </span>
      </div>
    </div>
  );
};

/* ── Main section ─────────────────────────────────────────────────────── */
const BeforeAfterSlider = () => {
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState(0);
  const [paused, setPaused]   = useState(false);
  const [sectionRef, visible] = useInView({ threshold: 0.15 });
  const autoRef               = useRef(null);

  /* Fetch real photos */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/photos?limit=20`)
      .then(r => r.json())
      .then(d => {
        const list = (d.success && d.photos?.length > 0)
          ? d.photos.filter(p => p.beforeUrl)
          : DEMO;
        setPhotos(list);
      })
      .catch(() => setPhotos(DEMO))
      .finally(() => setLoading(false));
  }, []);

  /* Auto-advance */
  useEffect(() => {
    if (paused || photos.length < 2) return;
    autoRef.current = setInterval(() => {
      setActive(a => (a + 1) % photos.length);
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [paused, photos.length]);

  const prev = () => { setActive(a => (a - 1 + photos.length) % photos.length); setPaused(true); };
  const next = () => { setActive(a => (a + 1) % photos.length); setPaused(true); };

  const visible3 = [
    photos[(active - 1 + photos.length) % photos.length],
    photos[active],
    photos[(active + 1) % photos.length],
  ].filter(Boolean);

  if (loading) return null;

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden"
      style={{ background: '#080808' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse,rgba(201,168,76,0.05) 0%,transparent 70%)' }} />
      </div>

      <style>{`
        @keyframes shimmerShift {
          0%,100% { transform: translateX(-100%); }
          50%      { transform: translateX(100%);  }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-14"
          style={{ transition: 'opacity .7s, transform .7s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
            <Sparkles className="w-3.5 h-3.5" /> Real Results
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.02] mb-4"
            style={{ letterSpacing: '-0.025em' }}>
            See the{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Difference
            </span>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Drag the gold slider to reveal the transformation on each job.
          </p>
        </div>

        {/* Carousel — 3-up layout on desktop, 1-up on mobile */}
        {photos.length > 0 && (
          <div className="relative"
            style={{ transition: 'opacity .7s .2s', opacity: visible ? 1 : 0 }}>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {visible3.map((photo, i) => {
                const isCenter = i === 1;
                const realIdx  = (active - 1 + photos.length + i) % photos.length;
                return (
                  <div
                    key={`${photo?.id}-${i}`}
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      height: isCenter ? '420px' : '340px',
                      alignSelf: 'center',
                      transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
                      boxShadow: isCenter
                        ? '0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,76,0.12)'
                        : '0 16px 40px rgba(0,0,0,0.5)',
                      opacity: isCenter ? 1 : 0.6,
                      transform: isCenter ? 'scale(1)' : 'scale(0.95)',
                      border: isCenter
                        ? '1px solid rgba(201,168,76,0.25)'
                        : '1px solid rgba(255,255,255,0.06)',
                      cursor: !isCenter ? 'pointer' : 'default',
                    }}
                    onClick={() => !isCenter && (i === 0 ? prev() : next())}>
                    {photo && <CompareCard photo={photo} isActive={isCenter} />}
                  </div>
                );
              })}
            </div>

            {/* Nav arrows */}
            {photos.length > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 hidden md:flex"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={next}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 hidden md:flex"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Mobile swipe buttons */}
            <div className="flex justify-center gap-3 mt-6 md:hidden">
              <button onClick={prev}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={next}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-6">
              {photos.map((_, i) => (
                <button key={i} onClick={() => { setActive(i); setPaused(true); }}
                  className="rounded-full transition-all"
                  style={{
                    width:  i === active ? '24px' : '6px',
                    height: '6px',
                    background: i === active ? GOLD_S : 'rgba(255,255,255,0.2)',
                  }} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-14"
          style={{ transition: 'opacity .7s .4s', opacity: visible ? 1 : 0 }}>
          <a href="/gallery"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: GOLD, color: '#0a0a0a', boxShadow: '0 0 30px rgba(201,168,76,0.2)' }}>
            View Full Gallery
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSlider;
