// src/hooks/useTranslation.js
import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en';
import fr from '../locales/fr';

const locales = { en, fr };

export const useTranslation = () => {
  const { lang, toggle, setLang } = useLanguage();
  const strings = locales[lang] || locales.en;

  // t('hero.title') — supports nested keys
  const t = (key) => {
    const parts = key.split('.');
    let val = strings;
    for (const part of parts) {
      val = val?.[part];
      if (val === undefined) return key; // fallback to key if missing
    }
    return val || key;
  };

  return { t, lang, toggle, setLang };
};
