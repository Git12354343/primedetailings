// src/components/home/CeramicTeaser.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import useInView from '../../hooks/useInView';

const GOLD  = 'linear-gradient(135deg,#00a8cc,#00d4ff)';
const GOLD_S = '#00a8cc';

const POINTS = [
  { icon: Droplets,    title: 'Hydrophobic',       desc: 'Water beads and sheets off, dragging dirt with it.' },
  { icon: ShieldCheck, title: '9H hard shell',     desc: 'Resists swirls, chemicals and UV fade for years.'  },
  { icon: Sparkles,    title: 'Mirror-deep gloss', desc: 'A wet-look finish that turns heads.'                },
];

// Real ceramic coating / water beading photo from Unsplash
const PHOTO_URL = '/ceramic-beads.jpg';
const CeramicTeaser = () => {
  const [ref, visible]     = useInView({ threshold: 0.15 });
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#0b0f1a' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 75% 30%, rgba(0,168,204,0.07), transparent 60%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">

        {/* LEFT — copy */}
        <div style={{ transition: 'opacity .7s, transform .7s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateX(-16px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Our Signature Service</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Ceramic{' '}
            <span style={{ color: '#fff' }}>
              coating
            </span>
            <br />that lasts years
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-7 max-w-md">
            A nano-ceramic shell bonds to your paint for protection measured in years, not weeks.
            See the science, the process, and the packages.
          </p>

          <div className="space-y-4 mb-8">
            {POINTS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="flex gap-3"
                style={{
                  transition: 'opacity .5s, transform .5s',
                  transitionDelay: `${0.2 + i * 0.1}s`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'none' : 'translateX(-10px)',
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,168,204,0.12)', border: '1px solid rgba(0,168,204,0.2)' }}>
                  <Icon className="w-4 h-4" style={{ color: GOLD_S }} />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{title}</div>
                  <div className="text-gray-400 text-sm">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/ceramic-coating"
            className="btn-luxury inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide group">
            Explore ceramic coating
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* RIGHT — real photo + overlay effects */}
        <div className="relative rounded-3xl overflow-hidden"
          style={{
            aspectRatio: '4/3',
            transition: 'opacity .7s .15s, transform .7s .15s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(20px)',
            background: '#1a1208',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,168,204,0.08)',
            border: '1px solid rgba(0,168,204,0.15)',
          }}>

          {/* Shimmer while loading */}
          {!imgLoaded && (
            <div className="absolute inset-0 z-10 animate-pulse"
              style={{ background: 'linear-gradient(110deg,rgba(255,255,255,0.02) 0%,rgba(255,255,255,0.05) 50%,rgba(255,255,255,0.02) 100%)' }} />
          )}

          {/* Main photo */}
          <img
            src={PHOTO_URL}
            alt="Ceramic coating water beading on car paint"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.6s' }}
            onLoad={() => setImgLoaded(true)}
          />

          {/* Dark vignette to blend edges */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg,rgba(0,0,0,0.35) 0%,transparent 50%,rgba(0,0,0,0.2) 100%)' }} />

          {/* Gold sweep sheen */}
          <div className="cer-sweep absolute inset-y-0 w-1/2 pointer-events-none"
            style={{ background: 'linear-gradient(105deg,transparent,rgba(0,212,255,0.07) 50%,transparent)' }} />

          {/* Stat badge — bottom left */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,168,204,0.3)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: GOLD_S }} />
            <span className="text-xs font-bold" style={{ color: GOLD_S }}>110°+ contact angle</span>
          </div>

          {/* Stat badge — top right */}
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="text-white text-xs font-bold">9H hardness</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CeramicTeaser;
