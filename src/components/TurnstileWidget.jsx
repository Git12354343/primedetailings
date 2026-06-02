// src/components/TurnstileWidget.jsx — Cloudflare Turnstile invisible CAPTCHA
import React, { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const TurnstileWidget = ({ onVerify, onError }) => {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) { onVerify?.('CAPTCHA_DISABLED'); return; }

    const render = () => {
      if (!ref.current || widgetId.current != null) return;
      widgetId.current = window.turnstile?.render(ref.current, {
        sitekey: SITE_KEY,
        size: 'invisible',
        callback: (token) => onVerify?.(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => { widgetId.current = null; },
      });
    };

    if (window.turnstile) { render(); return; }

    const script = document.getElementById('cf-turnstile-script');
    if (!script) {
      const s = document.createElement('script');
      s.id = 'cf-turnstile-script';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      script.addEventListener('load', render);
    }

    return () => { if (widgetId.current != null) window.turnstile?.remove(widgetId.current); };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={ref} />;
};

// Hook: returns { token, execute }
export const useTurnstile = () => {
  const [token, setToken] = React.useState(null);
  const widget = <TurnstileWidget onVerify={setToken} />;
  return { token, widget };
};

export default TurnstileWidget;
