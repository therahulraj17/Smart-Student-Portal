import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Need uppercase, lowercase and number';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === 'student' && form.studentId) payload.studentId = form.studentId;
      const user = await register(payload);
      toast.success(`Welcome, ${user.name}! Account created.`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (err.response?.status === 409) setErrors({ email: 'Email already registered' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const inputCls = (field) =>
    `w-full px-4 py-3 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${errors[field] ? 'border-red-400 bg-red-50' : 'border-surface-200'}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Create account</h1>
          <p className="text-surface-500 mt-1 text-sm">Join Smart Student Portal today</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="flex rounded-xl border border-surface-200 p-1 gap-1">
              {['student', 'teacher'].map((r) => (
                <button key={r} type="button" onClick={() => setForm((p) => ({ ...p, role: r }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${form.role === r ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-600 hover:text-surface-900'}`}>
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={inputCls('name')} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls('email')} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {form.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Student ID <span className="text-surface-400 font-normal">(optional)</span></label>
                <input name="studentId" value={form.studentId} onChange={handleChange} placeholder="e.g. STU2024001" className={inputCls('studentId')} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Min 8 chars, A-z, 0-9" className={`${inputCls('password')} pr-12`} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
