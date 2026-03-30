import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-surface-200 border-t-primary-600 rounded-full animate-spin ${className}`} />
  );
};

// ── Button ────────────────────────────────────────────────────────────────────
export const Button = ({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', leftIcon: LeftIcon, rightIcon: RightIcon, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm',
    secondary: 'bg-surface-100 hover:bg-surface-200 text-surface-800 focus:ring-surface-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'hover:bg-surface-100 text-surface-700 focus:ring-surface-300',
    outline: 'border border-surface-300 hover:bg-surface-50 text-surface-700 focus:ring-surface-300',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : LeftIcon && <LeftIcon className="w-4 h-4" />}
      {children}
      {RightIcon && !loading && <RightIcon className="w-4 h-4" />}
    </button>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', hover = false, padding = true }) => (
  <div className={`bg-white rounded-2xl border border-surface-200 shadow-card ${hover ? 'hover:shadow-card-hover transition-shadow' : ''} ${padding ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-surface-100 text-surface-600',
  orange: 'bg-orange-100 text-orange-700',
};

export const Badge = ({ children, color = 'gray', className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_COLORS[color] || BADGE_COLORS.gray} ${className}`}>
    {children}
  </span>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-surface-400" />
    </div>}
    <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-surface-500 mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
          <h3 className="font-display font-semibold text-lg text-surface-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-surface-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// ── FormField ─────────────────────────────────────────────────────────────────
export const FormField = ({ label, error, children, required }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-surface-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef(({ error, className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full px-4 py-2.5 text-sm bg-surface-50 border rounded-xl transition-all duration-150 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
      error ? 'border-red-400 bg-red-50' : 'border-surface-200 focus:bg-white'
    } ${className}`}
    {...props}
  />
));

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef(({ error, className = '', rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={`w-full px-4 py-2.5 text-sm bg-surface-50 border rounded-xl transition-all resize-none placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
      error ? 'border-red-400 bg-red-50' : 'border-surface-200 focus:bg-white'
    } ${className}`}
    {...props}
  />
));

// ── Select ─────────────────────────────────────────────────────────────────────
export const Select = React.forwardRef(({ error, className = '', children, ...props }, ref) => (
  <select
    ref={ref}
    className={`w-full px-4 py-2.5 text-sm bg-surface-50 border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
      error ? 'border-red-400' : 'border-surface-200 focus:bg-white'
    } ${className}`}
    {...props}
  >
    {children}
  </select>
));

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon: Icon, color = 'primary', sub }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="text-3xl font-display font-bold text-surface-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
};

// ── PageHeader ────────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-surface-900">{title}</h1>
      {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = 'primary', label, showPercent = true }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    primary: 'bg-primary-600',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-surface-600">{label}</span>}
          {showPercent && <span className="text-xs font-semibold text-surface-700">{pct}%</span>}
        </div>
      )}
      <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[color] || colors.primary}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
