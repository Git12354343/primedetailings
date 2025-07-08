// src/App.jsx (Updated with Authentication Routes)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Existing pages (create these if they don't exist yet)
// import Home from './pages/Home';
// import Services from './pages/Services';
// import Booking from './pages/Booking';
// import Contact from './pages/Contact';

// New authentication pages
import DetailerLogin from './pages/DetailerLogin';
import DetailerDashboard from './pages/DetailerDashboard';

// Layout components
//import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Temporary placeholder for missing pages
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page will be implemented in the full website.</p>
      <div className="mt-8">
        <a href="/detailer-login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Test Detailer Login
        </a>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Authentication Routes (No Navbar/Footer) */}
          <Route path="/detailer-login" element={<DetailerLogin />} />
          <Route path="/detailer-dashboard" element={<DetailerDashboard />} />
          
          {/* Public Website Routes (With Navbar/Footer) */}
          <Route path="/*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<PlaceholderPage title="Home" />} />
                <Route path="/services" element={<PlaceholderPage title="Services" />} />
                <Route path="/booking" element={<PlaceholderPage title="Booking" />} />
                <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
              </Routes>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;