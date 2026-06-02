import React from 'react';
import { Shield, Star, Zap, MapPin, CheckCircle, Award } from 'lucide-react';

const BADGES = [
  { icon: Shield,      label: 'Fully Insured',         sub: 'Licensed & covered' },
  { icon: Star,        label: '4.9★ Rating',            sub: '200+ verified reviews' },
  { icon: CheckCircle, label: 'Satisfaction Guarantee', sub: '100% or we return' },
  { icon: Zap,         label: 'Same-Day Available',     sub: 'Book before noon' },
  { icon: MapPin,      label: 'All of Québec',          sub: 'We come to you' },
  { icon: Award,       label: 'Certified Detailers',    sub: 'Professional grade' },
];

const GOLD = '#00a8cc';

const TrustStrip = () => (
  <section className="py-6 relative"
    style={{ background: 'rgba(0,168,204,0.03)', borderTop: '1px solid rgba(0,168,204,0.12)', borderBottom: '1px solid rgba(0,168,204,0.12)' }}>
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {BADGES.map(({ icon: Icon, label, sub }, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2 py-1">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
              <div>
                <span className="text-white text-xs font-bold">{label}</span>
                <span className="text-xs ml-1.5 hidden sm:inline" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</span>
              </div>
            </div>
            {i < BADGES.length - 1 && (
              <div className="w-px h-4 hidden sm:block" style={{ background: 'rgba(255,255,255,0.1)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
);

export default TrustStrip;
