import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AcademicCapIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><AcademicCapIcon className="w-7 h-7 text-white" /></div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Forgot Password</h1>
          <p className="text-surface-500 mt-1 text-sm">Enter your email to receive a reset link</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><EnvelopeIcon className="w-6 h-6 text-green-600" /></div>
              <p className="font-semibold text-surface-900 mb-1">Check your email</p>
              <p className="text-sm text-surface-500">If that account exists, a reset link has been sent.</p>
              <Link to="/login" className="block mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
              <Link to="/login" className="block text-center text-sm text-surface-500 hover:text-surface-700">Back to Login</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
