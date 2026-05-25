// src/components/ceramic/WaterBeadHero.jsx
// Cinematic hero with animated hydrophobic water beads + light sweep.
// Performance notes:
//  - Single <canvas> (one paint surface, not N DOM nodes)
//  - rAF loop PAUSES when the hero scrolls out of view (IntersectionObserver)
//    and when the tab is hidden (visibilitychange) -> 0% CPU when unseen
//  - Hard cap on bead count; scaled down on small screens
//  - Fully skipped when prefers-reduced-motion is set (static poster only)
//  - devicePixelRatio-aware but clamped to 2 so it never over-renders on phones
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Play } from 'lucide-react';
import { prefersReducedMotion } from '../../hooks/useInView';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';

const STATS = [
  { value: '5yr',  label: 'Protection' },
  { value: '9H',   label: 'Hardness' },
  { value: '110°', label: 'Contact angle' },
];

const WaterBeadCanvas = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const beadsRef = useRef([]);

  useEffect(() => {
    if (prefersReducedMotion()) return; // no animation at all
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const isSmall = w < 640;
    const MAX = isSmall ? 14 : 28; // particle cap

    const spawn = () => ({
      x: w * 0.45 + Math.random() * w * 0.6,
      y: -20,
      r: 2 + Math.random() * (isSmall ? 5 : 8),
      vy: 0.25 + Math.random() * 0.8,
      a: 0,
    });

    const seed = () => { beadsRef.current = Array.from({ length: Math.floor(MAX * 0.6) }, () => { const b = spawn(); b.y = Math.random() * h; b.a = 0.9; return b; }); };
    seed();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const beads = beadsRef.current;
      for (let i = 0; i < beads.length; i++) {
        const b = beads[i];
        b.y += b.vy; b.vy += 0.012; // slight gravity
        if (b.a < 0.9) b.a += 0.04;
        // droplet body
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,211,118,${0.10 * b.a})`;
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = `rgba(245,211,118,${0.38 * b.a})`;
        ctx.stroke();
        // highlight
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * b.a})`;
        ctx.fill();
        if (b.y - b.r > h) beads[i] = spawn();
      }
      while (beads.length < MAX && Math.random() < 0.25) beads.push(spawn());
      rafRef.current = requestAnimationFrame(draw);
    };

    const start = () => { if (!runningRef.current) { runningRef.current = true; rafRef.current = requestAnimationFrame(draw); } };
    const stop = () => { runningRef.current = false; cancelAnimationFrame(rafRef.current); };

    // Pause when hero is off-screen
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.05 });
    io.observe(canvas);

    // Pause when tab hidden
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    let resizeTimer;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); seed(); }, 200); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
};

const WaterBeadHero = ({
  badge = '9H Ceramic Protection',
  // Optional: pass a real image/video URL. Falls back to a gradient panel.
  imageUrl = null,
  videoUrl = null,
}) => {
  return (
    <section className="relative overflow-hidden" style={{ background: '#0a0a0a', minHeight: '88vh' }}>
      {/* Background layer: video > image > gradient panel */}
      {videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl} autoPlay muted loop playsInline
          poster={imageUrl || undefined} aria-hidden="true"
        />
      ) : imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
      ) : (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 70% 0%, #15130c 0%, #0a0a0a 55%)' }} />
      )}

      {/* Animated water beads (canvas) */}
      <WaterBeadCanvas />

      {/* Slow gold light-sweep (pure CSS, GPU) */}
      <div className="cer-sweep absolute inset-y-0 w-1/2 pointer-events-none gpu-accelerated"
        style={{ background: 'linear-gradient(105deg, transparent 0%, rgba(245,211,118,0.07) 45%, rgba(245,211,118,0.14) 50%, rgba(245,211,118,0.07) 55%, transparent 100%)' }} />

      {/* Readability gradient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.25) 0%, transparent 30%, rgba(10,10,10,0.6) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex items-center" style={{ minHeight: '88vh' }}>
        <div className="max-w-xl py-24">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 animate-fade-up"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-400 text-[11px] font-semibold tracking-[0.2em] uppercase">{badge}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.02] mb-5 animate-fade-up delay-100" style={{ letterSpacing: '-0.02em' }}>
            Liquid glass<br />for your{' '}
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>paint.</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md animate-fade-up delay-200">
            A nano-ceramic shell that bonds to your clearcoat — mirror gloss, water that rolls right off,
            and protection measured in years, not weeks.
          </p>

          <div className="flex flex-wrap gap-3 mb-10 animate-fade-up delay-300">
            <Link to="/booking?service=ceramic" className="btn-luxury inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold tracking-wide group">
              Get ceramic quote
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#ceramic-science" className="btn-ghost-luxury inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold">
              <Play className="w-4 h-4" /> See the science
            </a>
          </div>

          <div className="flex items-center gap-6 animate-fade-up delay-400">
            {STATS.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-9 bg-white/10" />}
                <div>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">{s.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaterBeadHero;
