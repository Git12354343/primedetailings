// src/components/LanguageToggle.jsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ className = '' }) => {
  const { lang, toggle } = useLanguage();

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-0.5 text-xs font-bold tracking-wider transition-all ${className}`}
      aria-label={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      style={{ color: 'rgba(255,255,255,0.6)' }}
      onMouseEnter={e => e.currentTarget.style.color = '#f5d376'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
    >
      <span style={{ color: lang === 'en' ? '#f5d376' : 'rgba(255,255,255,0.4)', fontWeight: lang === 'en' ? 700 : 400 }}>
        EN
      </span>
      <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 2px' }}>|</span>
      <span style={{ color: lang === 'fr' ? '#f5d376' : 'rgba(255,255,255,0.4)', fontWeight: lang === 'fr' ? 700 : 400 }}>
        FR
      </span>
    </button>
  );
};

export default LanguageToggle;
