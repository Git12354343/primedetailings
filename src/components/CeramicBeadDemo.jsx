// src/components/CeramicBeadDemo.jsx
// Drop-in interactive water bead demo for the Services page ceramic section.
// Usage: <CeramicBeadDemo />

import React, { useRef, useEffect, useState, useCallback } from 'react';

const GOLD = 'linear-gradient(135deg, #c9a84c, #f5d376)';
const GOLD_S = '#c9a84c';

// ── Water drop physics ────────────────────────────────────────────────────────
const createDrop = (x, y, ceramic) => ({
  x, y,
  vx: (Math.random() - 0.5) * (ceramic ? 3.5 : 0.6),
  vy: (Math.random() - 0.5) * (ceramic ? 3.5 : 0.6),
  r: 6 + Math.random() * 10,
  alpha: 0.85 + Math.random() * 0.15,
  life: 1,
  decay: ceramic ? 0.006 + Math.random() * 0.004 : 0.003 + Math.random() * 0.002,
  ceramic,
});

// ── Canvas demo ───────────────────────────────────────────────────────────────
const DropCanvas = ({ ceramic, active }) => {
  const canvasRef = useRef(null);
  const dropsRef  = useRef([]);
  const rafRef    = useRef(null);
  const lastRef   = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Surface texture
    ctx.fillStyle = ceramic ? 'rgba(30,28,24,0.9)' : 'rgba(22,22,24,0.9)';
    ctx.fillRect(0, 0, W, H);

    // Auto-add drops when active
    const now = Date.now();
    if (active && now - lastRef.current > 120) {
      lastRef.current = now;
      const x = 30 + Math.random() * (W - 60);
      const y = 30 + Math.random() * (H - 60);
      dropsRef.current.push(createDrop(x, y, ceramic));
    }

    // Update & draw drops
    dropsRef.current = dropsRef.current.filter(d => d.life > 0);
    dropsRef.current.forEach(d => {
      if (ceramic) {
        d.x  += d.vx;
        d.y  += d.vy;
        d.vx *= 0.96;
        d.vy *= 0.96;
      } else {
        d.x  += d.vx * 0.3;
        d.y  += d.vy * 0.3;
      }
      d.life -= d.decay;

      const alpha = Math.max(0, d.life * d.alpha);
      ctx.save();

      if (ceramic) {
        // Round, beading drop with specular highlight
        const grad = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.05, d.x, d.y, d.r);
        grad.addColorStop(0, `rgba(200,230,255,${alpha * 0.95})`);
        grad.addColorStop(0.4, `rgba(140,190,240,${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(80,140,200,${alpha * 0.3})`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Specular
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.28, d.y - d.r * 0.28, d.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.fill();
      } else {
        // Flat spreading blotch
        const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 1.8);
        grad.addColorStop(0, `rgba(100,140,200,${alpha * 0.6})`);
        grad.addColorStop(0.5, `rgba(80,120,180,${alpha * 0.35})`);
        grad.addColorStop(1, `rgba(60,100,160,0)`);
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r * 1.8, d.r * 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [ceramic, active]);

  useEffect(() => {
    dropsRef.current = [];
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const addDrop = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvasRef.current.width  / rect.width);
    const y = (clientY - rect.top)  * (canvasRef.current.height / rect.height);
    for (let i = 0; i < 4; i++) dropsRef.current.push(createDrop(x, y, ceramic));
  };

  return (
    <canvas ref={canvasRef} width={560} height={200}
      className="w-full rounded-xl cursor-crosshair touch-none select-none"
      style={{ maxHeight: '200px', border: '1px solid rgba(255,255,255,0.08)' }}
      onClick={addDrop} onTouchStart={addDrop} />
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CeramicBeadDemo = () => {
  const [ceramic, setCeramic] = useState(false);
  const [active, setActive]   = useState(true);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD_S }}>
          Interactive Demo
        </div>
        <h3 className="text-xl font-black text-white mb-1">See the Difference</h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Toggle ceramic coating on/off. Click or tap the surface to add water.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <span className="text-xs font-semibold" style={{ color: ceramic ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)' }}>
          No Coating
        </span>
        <button onClick={() => setCeramic(c => !c)}
          className="relative w-14 h-7 rounded-full transition-all duration-300"
          style={{ background: ceramic ? GOLD : 'rgba(255,255,255,0.12)' }}
          aria-label="Toggle ceramic coating">
          <span className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
            style={{ transform: ceramic ? 'translateX(30px)' : 'translateX(4px)' }} />
        </button>
        <span className="text-xs font-semibold" style={{ color: ceramic ? GOLD_S : 'rgba(255,255,255,0.3)' }}>
          Ceramic Coated
        </span>
        {ceramic && (
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(201,168,76,0.15)', color: GOLD_S }}>
            Hydrophobic ✓
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="px-4 pb-4">
        <DropCanvas ceramic={ceramic} active={active} />
        <p className="text-xs text-center mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Click or tap the surface to add water drops
        </p>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Without Ceramic</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Water spreads and soaks in. Paint exposed to contaminants.</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-bold mb-1" style={{ color: GOLD_S }}>With Ceramic Coat</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Water beads and rolls off. Paint stays protected for years.</p>
        </div>
      </div>
    </div>
  );
};

export default CeramicBeadDemo;
