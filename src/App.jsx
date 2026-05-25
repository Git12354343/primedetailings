import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { ContentSkeleton } from './components/LoadingSkeleton';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// New luxury components
import LoadingScreen    from './components/LoadingScreen';
import ScrollProgressBar from './components/ScrollProgressBar';
import StickyBookBar    from './components/StickyBookBar';
import PageTransition   from './components/PageTransition';

// Pages (lazy)
const Home             = lazy(() => import('./pages/Home'));
const Services         = lazy(() => import('./pages/Services'));
const Booking          = lazy(() => import('./pages/Booking'));
const Contact          = lazy(() => import('./pages/Contact'));
const Gallery          = lazy(() => import('./pages/Gallery'));
const CeramicCoating   = lazy(() => import('./pages/CeramicCoating'));
const BookingLookup    = lazy(() => import('./pages/BookingLookup'));
const DetailerLogin    = lazy(() => import('./pages/DetailerLogin'));
const DetailerDashboard = lazy(() => import('./pages/DetailerDashboard'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));

// ── Page loading fallback (dark themed) ─────────────────────────────────
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #c9a84c, #f5d376)' }}
      >
        <span className="text-black font-black text-sm">PD</span>
      </div>
      <div className="w-6 h-6 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
    </div>
  </div>
);

// ── Public layout (navbar + footer + sticky bar) ─────────────────────────
const PublicLayout = ({ children }) => (
  <ErrorBoundary>
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <StickyBookBar />
    </div>
  </ErrorBoundary>
);

// ── Protected layout (no navbar/footer) ─────────────────────────────────
const ProtectedLayout = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// ── Animated routes wrapper (needs to be inside Router) ──────────────────
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ScrollProgressBar />

      <PageTransition>
        <Routes location={location} key={location.key}>
          {/* Auth / dashboard — no layout */}
          <Route path="/detailer-login"     element={<ProtectedLayout><DetailerLogin /></ProtectedLayout>} />
          <Route path="/detailer-dashboard" element={<ProtectedLayout><DetailerDashboard /></ProtectedLayout>} />
          <Route path="/admin"              element={<ProtectedLayout><AdminPage /></ProtectedLayout>} />

          {/* Public pages */}
          <Route path="/"        element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/ceramic-coating" element={<PublicLayout><CeramicCoating /></PublicLayout>} />
          <Route path="/ceramic"         element={<Navigate to="/ceramic-coating" replace />} />
          <Route path="/booking"  element={<PublicLayout><Booking /></PublicLayout>} />
          <Route path="/contact"  element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/gallery"  element={<PublicLayout><Gallery /></PublicLayout>} />
          <Route path="/lookup"        element={<PublicLayout><BookingLookup /></PublicLayout>} />
          <Route path="/track"         element={<PublicLayout><BookingLookup /></PublicLayout>} />
          <Route path="/track-booking" element={<PublicLayout><BookingLookup /></PublicLayout>} />

          {/* 404 */}
          <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
        </Routes>
      </PageTransition>
    </>
  );
};

// ── Root app ─────────────────────────────────────────────────────────────
function EnhancedApp() {
  const [appReady, setAppReady] = useState(false);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        {/* Branded loading splash — shown once on first load */}
        {!appReady && <LoadingScreen onDone={() => setAppReady(true)} />}

        <div style={{ visibility: appReady ? 'visible' : 'hidden' }}>
          <Router>
            <AnimatedRoutes />
          </Router>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

// ── 404 Page (luxury dark) ────────────────────────────────────────────────
const NotFoundPage = () => (
  <div
    className="min-h-screen flex items-center justify-center px-4"
    style={{ background: '#0a0a0a' }}
  >
    <div className="text-center max-w-md">
      {/* Big 404 */}
      <div
        className="text-8xl font-black mb-4 leading-none"
        style={{
          background: 'linear-gradient(135deg, #c9a84c40, #c9a84c20)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}
      >
        404
      </div>

      <h2 className="text-2xl font-black text-white mb-3">Page Not Found</h2>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <a
          href="/"
          className="btn-luxury px-6 py-3 rounded-xl text-sm font-bold tracking-wide inline-flex items-center justify-center gap-2"
        >
          Go Home
        </a>
        <a
          href="/booking"
          className="btn-ghost-luxury px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center"
        >
          Book Now
        </a>
      </div>

      {/* Quick links */}
      <div
        className="grid grid-cols-2 gap-2 rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {[
          { label: 'Services',      href: '/services' },
          { label: 'Ceramic',       href: '/ceramic-coating' },
          { label: 'Book Now',      href: '/booking' },
          { label: 'Track Booking', href: '/lookup' },
        ].map(({ label, href }) => (
          <a
            key={href}
            href={href}
            className="py-2 px-3 rounded-lg text-sm text-gray-400 hover:text-yellow-400 transition-colors text-center"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  </div>
);

export default EnhancedApp;
