import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Services from '../pages/Services';
import Booking from '../pages/Booking';
import Contact from '../pages/Contact';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
};

export default AppRouter;