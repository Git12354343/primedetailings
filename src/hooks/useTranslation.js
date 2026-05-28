// src/hooks/useTranslation.js
import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en';
import fr from '../locales/fr';

const locales = { en, fr };

export const useTranslation = () => {
  const { lang, toggle, setLang } = useLanguage();
  const strings = locales[lang] || locales.en;
  const fallback = locales.en; // always fall back to EN if key missing in FR

  // t('hero.title') — supports nested keys with EN fallback
  const t = (key, vars) => {
    const parts = key.split('.');
    let val = strings;
    let fb  = fallback;

    for (const part of parts) {
      val = val?.[part];
      fb  = fb?.[part];
    }

    const result = (val !== undefined && val !== null) ? val : (fb !== undefined ? fb : key);

    // Simple variable interpolation: t('key', { name: 'Marc' }) with {{name}} in string
    if (vars && typeof result === 'string') {
      return result.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    }

    return result;
  };

  // isFr — handy shortcut for conditional logic
  const isFr = lang === 'fr';

  return { t, lang, isFr, toggle, setLang };
};

