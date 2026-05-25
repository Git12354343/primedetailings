// src/components/ceramic/GlossCompare.jsx
// Before/after gloss slider. Same interaction as your Home BeforeAfterSlider
// (reuses .comparison-slider / .comparison-handle / .comparison-btn from index.css)
// but the "after" side carries a slow drifting reflection sheen so the coated
// half literally looks wetter and deeper. Sheen is pure CSS (GPU) and is
// disabled by the global prefers-reduced-motion rule.
import React, { useRef, useState, useCallback } from 'react';
import useInView from '../../hooks/useInView';

const GlossCompare = ({
  beforeUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
  afterUrl  = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
}) => {
  const [pos, setPos] = useState(50);
  const [drag, setDrag] = useState(false);
  const boxRef = useRef(null);
  const [ref, visible] = useInView({ threshold: 0.2 });

  const move = useCallback((clientX) => {
    if (!boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - r.left, r.width));
    setPos((x / r.width) * 100);
  }, []);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0a0a0a' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12" style={{ transition: 'opacity .6s, transform .6s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(14px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">Depth & Gloss</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            See the{' '}
            <span style={{ background: 'linear-gradient(135deg,#c9a84c,#f5d376)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>wet-look</span>
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">Drag to compare untreated paint against a freshly coated finish.</p>
        </div>

        <div
          ref={boxRef}
          className="comparison-slider rounded-2xl h-64 sm:h-[26rem]"
          style={{ cursor: 'col-resize', opacity: visible ? 1 : 0, transition: 'opacity .7s .15s' }}
          onMouseDown={() => setDrag(true)}
          onMouseUp={() => setDrag(false)}
          onMouseLeave={() => setDrag(false)}
          onMouseMove={(e) => drag && move(e.clientX)}
          onTouchStart={() => setDrag(true)}
          onTouchEnd={() => setDrag(false)}
          onTouchMove={(e) => { move(e.touches[0].clientX); }}
        >
          {/* AFTER (coated) full-width beneath, with drifting sheen */}
          <div className="absolute inset-0">
            <img src={afterUrl} alt="After ceramic coating" className="w-full h-full object-cover" draggable={false} />
            <div className="cer-sheen absolute inset-0 pointer-events-none gpu-accelerated"
              style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 48%, rgba(245,211,118,0.10) 52%, transparent 70%)' }} />
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(201,168,76,0.9)', color: '#0a0a0a' }}>COATED</div>
          </div>

          {/* BEFORE (clipped) */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
            <img src={beforeUrl} alt="Before" className="w-full h-full object-cover" draggable={false}
              style={{ minWidth: `${10000 / Math.max(pos, 1)}%`, maxWidth: 'none', filter: 'saturate(0.8) brightness(0.9)' }} />
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>UNTREATED</div>
          </div>

          {/* Handle */}
          <div className="comparison-handle" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
            <div className="comparison-btn"><span style={{ fontSize: 11, letterSpacing: 1 }}>⟨ ⟩</span></div>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">Real results from Prestige Plus Detailing clients in Montreal</p>
      </div>
    </section>
  );
};

export default GlossCompare;
