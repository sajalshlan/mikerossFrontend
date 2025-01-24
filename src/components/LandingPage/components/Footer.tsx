import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 py-12 bg-white">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-lg mb-4">Cornelia Legal AI</h4>
          <p className="text-gray-600">Making legal assistance accessible to everyone.</p>
        </div>
        <div>
          <h5 className="font-semibold mb-4">Product</h5>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#features" className="hover:text-gray-900">Features</a></li>
            <li><a href="#pricing" className="hover:text-gray-900">Pricing</a></li>
            <li><a href="#integrations" className="hover:text-gray-900">Integrations</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold mb-4">Company</h5>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#about" className="hover:text-gray-900">About</a></li>
            <li><a href="#careers" className="hover:text-gray-900">Careers</a></li>
            <li><a href="#contact" className="hover:text-gray-900">Contact</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold mb-4">Legal</h5>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#privacy" className="hover:text-gray-900">Privacy Policy</a></li>
            <li><a href="#terms" className="hover:text-gray-900">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
        © 2024 Cornelia Legal AI. All rights reserved.
      </div>
    </div>
  </footer>
  );
};

export default Footer;
