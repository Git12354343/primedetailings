// src/components/LanguageToggle.jsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`flex items-center ${className}`}
      style={{ gap:'2px', background:'rgba(255,255,255,0.06)', borderRadius:'8px', padding:'3px', border:'1px solid rgba(255,255,255,0.1)' }}>
      <button
        onClick={() => setLang('en')}
        style={{
          padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:700,
          letterSpacing:'0.05em', transition:'all 0.15s', cursor:'pointer', border:'none',
          background: lang === 'en' ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'transparent',
          color: lang === 'en' ? '#0b0f1a' : 'rgba(255,255,255,0.45)',
        }}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLang('fr')}
        style={{
          padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:700,
          letterSpacing:'0.05em', transition:'all 0.15s', cursor:'pointer', border:'none',
          background: lang === 'fr' ? 'linear-gradient(135deg,#00a8cc,#00d4ff)' : 'transparent',
          color: lang === 'fr' ? '#0b0f1a' : 'rgba(255,255,255,0.45)',
        }}
        aria-label="Passer en français"
      >
        FR
      </button>
    </div>
  );
};

export default LanguageToggle;
