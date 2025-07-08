// src/EnhancedApp.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { ContentSkeleton } from './components/LoadingSkeleton';

// Layout components (load immediately)
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Booking = lazy(() => import('./pages/Booking'));
const Contact = lazy(() => import('./pages/Contact'));
const DetailerLogin = lazy(() => import('./pages/DetailerLogin'));
const DetailerDashboard = lazy(() => import('./pages/DetailerDashboard'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Enhanced loading component
const PageLoadingFallback = ({ pageName = "page" }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md w-full mx-auto p-8">
      <div className="text-center mb-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading {pageName}...</h2>
        <p className="text-gray-600">Please wait while we prepare your experience.</p>
      </div>
      <ContentSkeleton lines={4} />
    </div>
  </div>
);

// Layout wrapper for public pages
const PublicLayout = ({ children }) => (
  <ErrorBoundary>
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback pageName="content" />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  </ErrorBoundary>
);

// Protected route wrapper for authenticated pages
const ProtectedLayout = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback pageName="dashboard" />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Main App component
function EnhancedApp() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Authentication Routes (No Layout) */}
              <Route 
                path="/detailer-login" 
                element={
                  <ProtectedLayout>
                    <DetailerLogin />
                  </ProtectedLayout>
                } 
              />
              
              <Route 
                path="/detailer-dashboard" 
                element={
                  <ProtectedLayout>
                    <DetailerDashboard />
                  </ProtectedLayout>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedLayout>
                    <AdminPage />
                  </ProtectedLayout>
                } 
              />
              
              {/* Public Website Routes (With Layout) */}
              <Route 
                path="/" 
                element={
                  <PublicLayout>
                    <Home />
                  </PublicLayout>
                } 
              />
              
              <Route 
                path="/services" 
                element={
                  <PublicLayout>
                    <Services />
                  </PublicLayout>
                } 
              />
              
              <Route 
                path="/booking" 
                element={
                  <PublicLayout>
                    <Booking />
                  </PublicLayout>
                } 
              />
              
              <Route 
                path="/contact" 
                element={
                  <PublicLayout>
                    <Contact />
                  </PublicLayout>
                } 
              />
              
              {/* 404 Fallback */}
              <Route 
                path="*" 
                element={
                  <PublicLayout>
                    <NotFoundPage />
                  </PublicLayout>
                } 
              />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

// 404 Page Component
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="max-w-md w-full text-center">
      <div className="mb-8">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        <div className="space-y-4">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go Back Home
          </a>
          
          <div className="text-sm text-gray-500">
            <p>Need help? <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact us</a></p>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <a href="/services" className="text-blue-600 hover:text-blue-700">Our Services</a>
          <a href="/booking" className="text-blue-600 hover:text-blue-700">Book Now</a>
          <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact</a>
          <a href="/detailer-login" className="text-blue-600 hover:text-blue-700">Staff Login</a>
        </div>
      </div>
    </div>
  </div>
);

export default EnhancedApp;