import React from 'react';
import NavBar from './components/NavBar.tsx';
import LandingBody from './components/LandingBody.tsx';
import Features from './components/Feature.tsx';
import Demo from './components/Demo.tsx';
import Footer from './components/Footer.tsx';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <NavBar />

      {/* Body */}
      <LandingBody/>

      {/* Features Section */}
      <Features/>

      {/* Demo Section */}
      <Demo/>

      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default Landing;