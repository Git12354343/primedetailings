// src/context/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('pd_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('pd_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(l => l === 'en' ? 'fr' : 'en');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
