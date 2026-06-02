import React from 'react';

// ── Brand logos ──────────────────────────────────────────────────────────────
// Put transparent PNG logos inside:
// public/brands-transparent/
//
// Example:
// public/brands-transparent/rupes.png
//
// React/Vite path:
// /brands-transparent/rupes.png

const BRANDS = [
  {
    name: 'Chemical Guys',
    category: 'Car Care',
    logoUrl: '/brands-transparent/chemical-guys.png',
  },
  {
    name: 'Simoniz',
    category: 'Paint Protection',
    logoUrl: '/brands-transparent/simoniz.png',
  },
  {
    name: "Meguiar's",
    category: 'Detailing Products',
    logoUrl: '/brands-transparent/meguiars.png',
  },
  {
    name: 'Turtle Wax',
    category: 'Wax & Protection',
    logoUrl: '/brands-transparent/turtle-wax.png',
  },
  {
    name: "Adam's Polishes",
    category: 'Polishing Products',
    logoUrl: '/brands-transparent/adams-polishes.png',
  },
  {
    name: 'Gyeon',
    category: 'Quartz Coatings',
    logoUrl: '/brands-transparent/gyeon.png',
  },
  {
    name: 'CarPro',
    category: 'Ceramic Care',
    logoUrl: '/brands-transparent/carpro.png',
  },
  {
    name: 'Rupes',
    category: 'Polishing Machines',
    logoUrl: '/brands-transparent/rupes.png',
  },
  {
    name: 'Gtechniq',
    category: 'Ceramic Coating',
    logoUrl: '/brands-transparent/gtechniq.png',
  },
  {
    name: 'Koch-Chemie',
    category: 'Professional Grade',
    logoUrl: '/brands-transparent/koch-chemie.png',
  },
  {
    name: 'Sonax',
    category: 'German Engineering',
    logoUrl: '/brands-transparent/sonax.png',
  },
  {
    name: '3M',
    category: 'Surface Protection',
    logoUrl: '/brands-transparent/3m.png',
  },
  {
    name: 'P&S Detail Products',
    category: 'Detailing Chemicals',
    logoUrl: '/brands-transparent/ps-detail-products.png',
  },
  {
    name: 'Menzerna',
    category: 'Polishing Compounds',
    logoUrl: '/brands-transparent/menzerna.png',
  },
  {
    name: "Poorboy's World",
    category: 'Car Care Products',
    logoUrl: '/brands-transparent/poorboys-world.png',
  },
  {
    name: 'Alchimy7',
    category: 'Premium Detailing',
    logoUrl: '/brands-transparent/alchimy7.png',
  },
  {
    name: 'Fusso Coat',
    category: 'Long Lasting Wax',
    logoUrl: '/brands-transparent/fusso-coat.png',
  },
  {
    name: 'Detail Factory',
    category: 'Detailing Tools',
    logoUrl: '/brands-transparent/detail-factory.png',
  },
  {
    name: 'Nasiol',
    category: 'Surface Protection',
    logoUrl: '/brands-transparent/nasiol.png',
  },
  {
    name: 'AMMO Detailing',
    category: 'Professional Detailing',
    logoUrl: '/brands-transparent/ammo-detailing.png',
  },
];

const BrandCard = ({ brand }) => {
  return (
    <div className="brand-card flex-shrink-0 mx-3 select-none">
      <div className="brand-logo-box">
        <img
          src={brand.logoUrl}
          alt={`${brand.name} logo`}
          className="brand-logo"
          draggable="false"
          onError={(e) => {
            e.currentTarget.style.display = 'none';

            const fallback =
              e.currentTarget.parentElement?.querySelector('.brand-fallback');

            if (fallback) {
              fallback.style.display = 'block';
            }
          }}
        />

        <div className="brand-fallback text-center" style={{ display: 'none' }}>
          <p className="text-neutral-950 font-black text-sm leading-none">
            {brand.name}
          </p>
          <p className="text-xs mt-1 text-neutral-600">{brand.category}</p>
        </div>
      </div>
    </div>
  );
};

const BrandBand = () => {
  const doubledBrands = [...BRANDS, ...BRANDS];

  return (
    <section className="brand-band relative overflow-hidden py-12">
      <div className="brand-fade brand-fade-left" />
      <div className="brand-fade brand-fade-right" />

      <div className="relative z-20 text-center mb-8 px-4">
        <p className="brand-eyebrow">Proudly Using Premium Products</p>
        <div className="brand-divider" />
      </div>

      <div className="brand-track">
        {doubledBrands.map((brand, index) => (
          <BrandCard key={`${brand.name}-${index}`} brand={brand} />
        ))}
      </div>

      <style>{`
        .brand-band {
          background:
            radial-gradient(circle at top center, rgba(0,168,204,0.13), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012));
          border-top: 1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .brand-band::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.035),
              transparent
            );
          opacity: 0.45;
        }

        .brand-eyebrow {
          color: rgba(0,168,204,0.88);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.32em;
        }

        .brand-divider {
          width: 132px;
          height: 1px;
          margin: 15px auto 0;
          background: linear-gradient(
            to right,
            transparent,
            rgba(0,168,204,0.85),
            transparent
          );
        }

        .brand-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 140px;
          z-index: 15;
          pointer-events: none;
        }

        .brand-fade-left {
          left: 0;
          background: linear-gradient(
            to right,
            #0b0f1a 0%,
            rgba(8,8,8,0.92) 34%,
            transparent 100%
          );
        }

        .brand-fade-right {
          right: 0;
          background: linear-gradient(
            to left,
            #0b0f1a 0%,
            rgba(8,8,8,0.92) 34%,
            transparent 100%
          );
        }

        .brand-track {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          width: max-content;
          animation: brandScroll 58s linear infinite;
        }

        .brand-track:hover {
          animation-play-state: paused;
        }

        .brand-card {
          width: 250px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.94),
              rgba(210,210,210,0.72)
            );

          border: 1px solid rgba(255,255,255,0.58);

          box-shadow:
            0 20px 52px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.98),
            inset 0 -1px 0 rgba(0,0,0,0.14);

          backdrop-filter: blur(14px);
          overflow: hidden;

          transition:
            transform 260ms ease,
            border-color 260ms ease,
            background 260ms ease,
            box-shadow 260ms ease;
        }

        .brand-card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              120deg,
              rgba(255,255,255,0.55),
              transparent 38%,
              rgba(255,255,255,0.18)
            );
          opacity: 0.7;
        }

        .brand-card:hover {
          transform: translateY(-5px) scale(1.03);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,1),
              rgba(226,226,226,0.88)
            );

          border-color: rgba(0,168,204,0.7);

          box-shadow:
            0 28px 74px rgba(0,0,0,0.54),
            0 0 34px rgba(0,168,204,0.2),
            inset 0 1px 0 rgba(255,255,255,1);
        }

        .brand-logo-box {
          position: relative;
          z-index: 2;
          width: 190px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }

        .brand-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0.92;

          /*
            Designed for dark/gray logos on light silver glass cards.
            No invert and no blend mode.
          */
          filter: grayscale(1) contrast(1.25) brightness(0.74);

          transition:
            filter 260ms ease,
            opacity 260ms ease,
            transform 260ms ease;
        }

        .brand-card:hover .brand-logo {
          opacity: 1;
          transform: scale(1.055);
          filter: grayscale(1) contrast(1.38) brightness(0.66);
        }

        @keyframes brandScroll {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-track {
            animation: none;
          }
        }

        @media (max-width: 768px) {
          .brand-card {
            width: 218px;
            height: 88px;
            border-radius: 18px;
          }

          .brand-logo-box {
            width: 166px;
            height: 54px;
          }

          .brand-fade {
            width: 76px;
          }

          .brand-track {
            animation-duration: 46s;
          }

          .brand-eyebrow {
            letter-spacing: 0.24em;
          }
        }

        @media (max-width: 480px) {
          .brand-band {
            padding-top: 2.4rem;
            padding-bottom: 2.4rem;
          }

          .brand-card {
            width: 190px;
            height: 78px;
            margin-left: 8px;
            margin-right: 8px;
            border-radius: 16px;
          }

          .brand-logo-box {
            width: 148px;
            height: 48px;
          }

          .brand-fade {
            width: 48px;
          }

          .brand-eyebrow {
            font-size: 10px;
            letter-spacing: 0.2em;
          }
        }
      `}</style>
    </section>
  );
};

export default BrandBand;
