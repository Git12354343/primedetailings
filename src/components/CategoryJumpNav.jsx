// src/components/CategoryJumpNav.jsx
//
// Horizontal sticky pill-nav for the Services page.
// Sits below the main navbar (top-16 = 64px) so it never overlaps it.
// Auto-highlights the active section while the user scrolls.
// Auto-scrolls the active pill into view inside the overflow container.

import React, { useEffect, useRef } from 'react';

const CategoryJumpNav = ({ items, activeId, onNavigate }) => {
  const stripRef  = useRef(null);   // the scrollable pill container
  const pillRefs  = useRef({});     // individual pill refs for auto-scroll

  // When activeId changes, scroll that pill into centre of the strip
  useEffect(() => {
    const pill = pillRefs.current[activeId];
    const strip = stripRef.current;
    if (!pill || !strip) return;
    const pillLeft   = pill.offsetLeft;
    const pillWidth  = pill.offsetWidth;
    const stripWidth = strip.offsetWidth;
    strip.scrollTo({
      left: pillLeft - stripWidth / 2 + pillWidth / 2,
      behavior: 'smooth',
    });
  }, [activeId]);

  if (!items || items.length < 2) return null;

  return (
    <div
      className="sticky z-30 w-full"
      style={{
        top: '64px', // below h-16 navbar
        background: 'rgba(11,15,26,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      role="navigation"
      aria-label="Services sections"
    >
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto px-4 py-2.5 max-w-6xl mx-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              ref={el => { pillRefs.current[id] = el; }}
              onClick={() => onNavigate(id)}
              aria-current={isActive ? 'true' : undefined}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg,#00a8cc,#00d4ff)'
                  : 'rgba(255,255,255,0.06)',
                color:  isActive ? '#0b0f1a' : 'rgba(255,255,255,0.55)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isActive ? '0 0 12px rgba(0,168,204,0.35)' : 'none',
                minHeight: '32px',
              }}
            >
              {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Hide scrollbar on webkit */}
      <style>{`
        [data-jump-strip]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default CategoryJumpNav;
