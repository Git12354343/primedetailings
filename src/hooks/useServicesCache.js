// src/hooks/useServicesCache.js
// Shared in-memory cache — all components that call this hook
// share one fetch. No external libraries needed.
// Covers services, addOns, AND packages — no component fetches these independently.

let cache = null;
let cacheTime = 0;
let inFlight = null;
const TTL = 5 * 60 * 1000; // 5 minutes

const listeners = new Set();

const notify = () => listeners.forEach(fn => fn());

export const fetchServicesData = async (force = false) => {
  const now = Date.now();

  // Return cache if fresh
  if (!force && cache && now - cacheTime < TTL) {
    return cache;
  }

  // Deduplicate concurrent fetches — return the same promise
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const [sr, ar] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/services/active`),
        fetch(`${import.meta.env.VITE_API_URL}/services/addons/active`),
      ]);
      const sd = await sr.json();
      const ad = await ar.json();

      // Packages fetched separately — if the table doesn't exist yet it fails silently
      let pkgs = [];
      try {
        const pr = await fetch(`${import.meta.env.VITE_API_URL}/packages/active`);
        const pd = await pr.json();
        if (pd.success) pkgs = pd.packages;
      } catch { /* packages table may not be migrated yet */ }

      cache = {
        services: sd.success ? sd.services : [],
        addOns:   ad.success ? ad.addOns   : [],
        packages: pkgs,
        error:    !sd.success ? 'Failed to load services' : null,
      };
      cacheTime = Date.now();
      notify();
      return cache;
    } catch {
      cache = { services: [], addOns: [], packages: [], error: 'Could not connect to server' };
      cacheTime = Date.now();
      notify();
      return cache;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

export const invalidateServicesCache = () => {
  cache = null;
  cacheTime = 0;
};

// React hook
import { useState, useEffect } from 'react';

const useServicesCache = () => {
  const [data, setData] = useState(cache ?? { services: [], addOns: [], packages: [], error: null });
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await fetchServicesData();
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    };

    // Subscribe to cache updates
    const onUpdate = () => {
      if (!cancelled && cache) setData({ ...cache });
    };
    listeners.add(onUpdate);

    load();

    return () => {
      cancelled = true;
      listeners.delete(onUpdate);
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    const result = await fetchServicesData(true);
    setData(result);
    setLoading(false);
  };

  return { ...data, loading, refresh };
};

export default useServicesCache;
