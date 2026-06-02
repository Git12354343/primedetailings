import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState('visible'); // 'visible' | 'fading' | 'entering'
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key === prevKey.current) return;
    prevKey.current = location.key;

    // Fade out
    setPhase('fading');

    const swap = setTimeout(() => {
      setDisplayLocation(location);
      setPhase('entering');
    }, 180);

    const done = setTimeout(() => {
      setPhase('visible');
    }, 380);

    return () => { clearTimeout(swap); clearTimeout(done); };
  }, [location]);

  const opacity = phase === 'fading' ? 0 : phase === 'entering' ? 0 : 1;
  const translateY = phase === 'entering' ? '12px' : '0px';

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY})`,
        transition: phase === 'fading'
          ? 'opacity 0.18s ease-in'
          : 'opacity 0.22s ease-out, transform 0.22s ease-out',
      }}
    >
      {/* Render the display location's children */}
      {React.cloneElement(children, { key: displayLocation.key })}
    </div>
  );
};

export default PageTransition;
