// src/utils/serviceUtils.jsx
// Utility functions for displaying services, add-ons, and extras
// Includes bilingual support: falls back to EN if FR field missing

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

// ── BILINGUAL HOOKS ───────────────────────────────────────────────────────────

/**
 * Hook — returns tField() to get the right language version of any field
 *
 * Usage:
 *   const { tField } = useServiceTranslation();
 *   tField(service, 'name')        → service.nameFr (if FR) || service.name
 *   tField(service, 'description') → service.descriptionFr  || service.description
 *   tField(service, 'includes')    → service.includesFr     || service.includes
 *   tField(pkg,     'tagline')     → pkg.taglineFr          || pkg.tagline
 */
export const useServiceTranslation = () => {
  const { lang } = useLanguage();

  const tField = (obj, field) => {
    if (!obj) return '';
    if (lang === 'fr') {
      const frKey = field + 'Fr'; // e.g. nameFr, descriptionFr, includesFr
      if (obj[frKey]) return obj[frKey];
    }
    return obj[field] || '';
  };

  return { tField, lang };
};

/**
 * Pure function version — for use outside React components
 * getLocalizedField(service, 'name', 'fr') → service.nameFr || service.name
 */
export const getLocalizedField = (obj, field, lang = 'en') => {
  if (!obj) return '';
  if (lang === 'fr') {
    const frKey = field + 'Fr';
    if (obj[frKey]) return obj[frKey];
  }
  return obj[field] || '';
};

// ── SERVICE / EXTRAS PARSERS ──────────────────────────────────────────────────

/**
 * Parse services from a booking record.
 * Handles: string[], number[] (IDs), object[], JSON string
 * If lang + availableServices provided, returns localized names.
 */
export const parseServices = (services, availableServices = [], lang = 'en') => {
  if (!services) return [];

  try {
    // Already an array of strings
    if (Array.isArray(services) && services.length > 0 && typeof services[0] === 'string') {
      return services;
    }

    // JSON string → parse first
    const parsed = Array.isArray(services) ? services : JSON.parse(services);

    // Array of objects with id/name
    if (parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed.map(s => getLocalizedField(s, 'name', lang) || s.serviceName || 'Unknown Service');
    }

    // Array of IDs → look up in availableServices
    if (parsed.length > 0 && typeof parsed[0] === 'number') {
      return parsed.map(id => {
        const found = availableServices.find(s => s.id === id);
        return found ? getLocalizedField(found, 'name', lang) : `Service #${id}`;
      });
    }

    return parsed;
  } catch (err) {
    console.warn('parseServices error:', err);
    return Array.isArray(services) ? services : [];
  }
};

/**
 * Parse add-ons/extras from a booking record.
 * Same logic as parseServices but for add-ons.
 */
export const parseExtras = (extras, availableAddOns = [], lang = 'en') => {
  if (!extras) return [];

  try {
    if (Array.isArray(extras) && extras.length > 0 && typeof extras[0] === 'string') {
      return extras;
    }

    const parsed = Array.isArray(extras) ? extras : JSON.parse(extras);

    if (parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed.map(a => getLocalizedField(a, 'name', lang) || a.addonName || 'Unknown Add-on');
    }

    if (parsed.length > 0 && typeof parsed[0] === 'number') {
      return parsed.map(id => {
        const found = availableAddOns.find(a => a.id === id);
        return found ? getLocalizedField(found, 'name', lang) : `Add-on #${id}`;
      });
    }

    return parsed;
  } catch (err) {
    console.warn('parseExtras error:', err);
    return Array.isArray(extras) ? extras : [];
  }
};

// ── DISPLAY COMPONENTS ────────────────────────────────────────────────────────

/**
 * ServiceDisplay — renders service name badges from a booking record
 * Automatically uses correct language if lang prop provided
 */
export const ServiceDisplay = ({ services, availableServices = [], lang = 'en', className = '' }) => {
  const names = parseServices(services, availableServices, lang);

  if (names.length === 0) {
    return <span className={`text-gray-500 text-xs ${className}`}>No services</span>;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {names.slice(0, 3).map((name, i) => (
        <span key={i}
          className="inline-block text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(0,168,204,0.12)', color: '#00d4ff', border: '1px solid rgba(0,168,204,0.2)' }}>
          {name}
        </span>
      ))}
      {names.length > 3 && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
          +{names.length - 3} more
        </span>
      )}
    </div>
  );
};

/**
 * ExtrasDisplay — renders add-on name badges from a booking record
 */
export const ExtrasDisplay = ({ extras, availableAddOns = [], lang = 'en', className = '' }) => {
  const names = parseExtras(extras, availableAddOns, lang);

  if (names.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {names.map((name, i) => (
        <span key={i}
          className="inline-block text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
          {name}
        </span>
      ))}
    </div>
  );
};

/**
 * ServiceBilingualDisplay — renders service with bilingual support
 * Hooks into LanguageContext automatically
 */
export const ServiceBilingualDisplay = ({ service, showDescription = false, className = '' }) => {
  const { tField } = useServiceTranslation();
  const name = tField(service, 'name');
  const desc = tField(service, 'description');

  return (
    <div className={className}>
      <span className="font-semibold text-white">{name}</span>
      {showDescription && desc && (
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
      )}
    </div>
  );
};
