// src/components/ceramic/CoatingCrossSection.jsx
// Educational "what is ceramic coating" section.
// An SVG cross-section that builds up layer-by-layer on scroll-in:
//   paint -> clearcoat -> ceramic bonding layer -> hydrophobic beads
// Pure CSS transitions on opacity/transform (GPU). Reveals once.
import React from 'react';
import { Layers, Droplets, ShieldCheck, Sparkles } from 'lucide-react';
import useInView from '../../hooks/useInView';

const LAYERS = [
  { icon: Layers,      title: 'Bare clearcoat',  desc: 'Factory paint is porous and oxidizes over time.', color: '#94a3b8' },
  { icon: ShieldCheck, title: 'Ceramic bond',    desc: 'SiO₂ chemically bonds to the clearcoat — permanent, not a wax.', color: '#00a8cc' },
  { icon: Sparkles,    title: 'Glass-hard shell', desc: '9H surface resists swirls, chemicals and UV fade.', color: '#a78bfa' },
  { icon: Droplets,    title: 'Hydrophobic top',  desc: 'Water beads at 110°+ and drags dirt off as it rolls.', color: '#60a5fa' },
];

const CoatingCrossSection = () => {
  const [ref, visible] = useInView({ threshold: 0.25 });

  const layerStyle = (i) => ({
    transition: 'opacity 0.7s ease, transform 0.7s ease',
    transitionDelay: `${i * 0.18}s`,
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(14px)',
  });

  return (
    <section id="ceramic-science" ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0b0f1a' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,168,204,0.06), transparent 60%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14" style={layerStyle(0)}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">The Science</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            What actually happens to your{' '}
            <span style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>paint</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">A microscopic cross-section, built layer by layer.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* SVG cross-section */}
          <div className="rounded-2xl p-6 glass-card" style={layerStyle(1)}>
            <svg viewBox="0 0 400 300" className="w-full h-auto" role="img" aria-label="Cross-section of ceramic coating layers on car paint">
              <defs>
                <linearGradient id="cerMetal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a3a40" /><stop offset="100%" stopColor="#1c1c20" />
                </linearGradient>
                <linearGradient id="cerPaint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b2b33" /><stop offset="100%" stopColor="#202028" />
                </linearGradient>
              </defs>

              {/* metal substrate */}
              <g style={{ transition: 'opacity .6s', transitionDelay: '0s', opacity: visible ? 1 : 0 }}>
                <rect x="20" y="210" width="360" height="60" rx="4" fill="url(#cerMetal)" />
                <text x="200" y="245" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="600" letterSpacing="2">METAL PANEL</text>
              </g>
              {/* paint + clearcoat */}
              <g style={{ transition: 'opacity .6s, transform .6s', transitionDelay: '.2s', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-10px)' }}>
                <rect x="20" y="170" width="360" height="42" rx="3" fill="url(#cerPaint)" />
                <text x="200" y="196" textAnchor="middle" fill="#8b8b94" fontSize="11" fontWeight="600" letterSpacing="1">PAINT + CLEARCOAT</text>
              </g>
              {/* ceramic bonding layer */}
              <g style={{ transition: 'opacity .6s, transform .6s', transitionDelay: '.45s', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-10px)' }}>
                <rect x="20" y="146" width="360" height="26" rx="3" fill="rgba(0,168,204,0.22)" stroke="rgba(0,168,204,0.6)" strokeWidth="1" />
                <text x="200" y="163" textAnchor="middle" fill="#00d4ff" fontSize="10.5" fontWeight="700" letterSpacing="1.5">CERAMIC LAYER · 9H</text>
              </g>
              {/* hydrophobic beads */}
              <g style={{ transition: 'opacity .7s', transitionDelay: '.7s', opacity: visible ? 1 : 0 }}>
                {[70, 130, 200, 270, 330].map((cx, i) => {
                  const r = [16, 11, 20, 13, 17][i];
                  return (
                    <g key={cx}>
                      <ellipse cx={cx} cy={146 - r * 0.55} rx={r} ry={r * 0.78}
                        fill="rgba(120,180,255,0.12)" stroke="rgba(150,200,255,0.55)" strokeWidth="1" />
                      <ellipse cx={cx - r * 0.3} cy={146 - r * 0.85} rx={r * 0.28} ry={r * 0.22} fill="rgba(255,255,255,0.6)" />
                    </g>
                  );
                })}
                <text x="200" y="40" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="600" letterSpacing="1">WATER BEADS · 110°+ CONTACT ANGLE</text>
              </g>
            </svg>
          </div>

          {/* Layer legend */}
          <div className="space-y-3">
            {LAYERS.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl group" style={{ ...layerStyle(i + 1), background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoatingCrossSection;
