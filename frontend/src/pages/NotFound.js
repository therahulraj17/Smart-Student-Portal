import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 text-center px-4">
      <p className="text-8xl font-display font-bold text-primary-200 mb-4">404</p>
      <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Page not found</h1>
      <p className="text-surface-500 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">Go to Dashboard</Link>
    </div>
  );
}
