// src/components/ceramic/ProcessTimeline.jsx
// Vertical gold-spine timeline. Each step fades + its node fills gold
// as the section reveals (staggered). Reduced-motion shows all at once.
import React from 'react';
import { Droplets, Layers, Wand2, SprayCan, ShieldCheck, Sun } from 'lucide-react';
import useInView from '../../hooks/useInView';

const STEPS = [
  { icon: Droplets,    title: 'Deep decontamination', desc: 'pH-balanced foam, iron remover and a full hand wash strip embedded grime.' },
  { icon: Layers,      title: 'Clay bar treatment',   desc: 'Bonded contaminants are pulled from the clearcoat until glass-smooth.' },
  { icon: Wand2,       title: 'Paint correction',     desc: 'Multi-stage machine polishing removes swirls and restores true depth.' },
  { icon: SprayCan,    title: 'Panel wipe (IPA)',     desc: 'Every oil and polishing residue is removed so the coating can bond.' },
  { icon: ShieldCheck, title: 'Ceramic application',  desc: 'The SiO₂ coating is applied panel by panel and leveled by hand.' },
  { icon: Sun,         title: 'Infrared curing',      desc: 'Controlled heat cures the coating to a hard, hydrophobic shell.' },
];

const ProcessTimeline = () => {
  const [ref, visible] = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" style={{ background: '#111827' }}>
      <div className="divider-gold absolute top-0 inset-x-0" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16" style={{ transition: 'opacity .6s, transform .6s', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(14px)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(0,168,204,0.08)', border: '1px solid rgba(0,168,204,0.2)' }}>
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Our Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Six stages of{' '}
            <span style={{ background: 'linear-gradient(135deg,#00a8cc,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>obsession</span>
          </h2>
          <p className="text-gray-400 text-base max-w-lg mx-auto">A ceramic coating is only as good as the prep beneath it. This is the full day of work behind the shine.</p>
        </div>

        <div className="relative pl-14 sm:pl-16">
          {/* Gold spine */}
          <div className="absolute left-[26px] sm:left-[30px] top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="absolute left-[26px] sm:left-[30px] top-2 w-px"
            style={{
              background: 'linear-gradient(180deg, #00a8cc, #00d4ff)',
              boxShadow: '0 0 12px rgba(0,168,204,0.5)',
              height: visible ? 'calc(100% - 16px)' : '0%',
              transition: 'height 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s',
            }} />

          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative mb-10 last:mb-0"
              style={{ transition: 'opacity .6s, transform .6s', transitionDelay: `${0.25 + i * 0.13}s`, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateX(-10px)' }}>
              {/* Node */}
              <div className="absolute -left-14 sm:-left-16 top-0 w-[52px] sm:w-[60px] flex justify-center">
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: visible ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'rgba(255,255,255,0.06)',
                    border: '2px solid #111827',
                    boxShadow: visible ? '0 0 18px rgba(0,168,204,0.45)' : 'none',
                    transition: 'background .5s, box-shadow .5s',
                    transitionDelay: `${0.3 + i * 0.13}s`,
                  }}>
                  <Icon className="w-5 h-5" style={{ color: visible ? '#0b0f1a' : '#4b5563', transition: 'color .5s', transitionDelay: `${0.3 + i * 0.13}s` }} />
                </div>
              </div>
              {/* Card */}
              <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-cyan-500/70 text-xs font-black tracking-widest">0{i + 1}</span>
                  <h3 className="text-white font-bold text-base">{title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessTimeline;
