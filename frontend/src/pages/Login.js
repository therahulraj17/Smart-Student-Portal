import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      if (err.response?.status === 401) setErrors({ password: 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">Smart Student Portal</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Your Learning Journey Starts Here
          </h2>
          <p className="text-primary-200 text-lg leading-relaxed">
            A unified platform for students, teachers, and administrators to collaborate, learn, and grow.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Active Students', value: '2,400+' },
            { label: 'Courses Available', value: '120+' },
            { label: 'Assignments Graded', value: '18k+' },
            { label: 'Quiz Attempts', value: '45k+' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-display font-bold text-white">{s.value}</p>
              <p className="text-primary-200 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-surface-50">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-surface-900">Smart Student Portal</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-surface-900">Welcome back</h1>
            <p className="text-surface-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email address</label>
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" autoComplete="email"
                className={`w-full px-4 py-3 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'border-surface-200'}`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Enter your password" autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-12 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${errors.password ? 'border-red-400 bg-red-50' : 'border-surface-200'}`}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
                <input type="checkbox" className="rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">Create one</Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-amber-700 font-mono">
              <p>Admin: admin@demo.com / Admin@123</p>
              <p>Teacher: teacher@demo.com / Teacher@123</p>
              <p>Student: student@demo.com / Student@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
