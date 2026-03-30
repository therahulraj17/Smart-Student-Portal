import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) { toast.error('Need uppercase, lowercase and number'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><AcademicCapIcon className="w-7 h-7 text-white" /></div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Reset Password</h1>
          <p className="text-surface-500 mt-1 text-sm">Enter your new password below</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, A-z, 0-9"
                  className="w-full px-4 py-3 pr-12 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting...</> : 'Reset Password'}
            </button>
            <Link to="/login" className="block text-center text-sm text-surface-500 hover:text-surface-700">Back to Login</Link>
          </form>
        </div>
      </div>
    </div>
  );
}
