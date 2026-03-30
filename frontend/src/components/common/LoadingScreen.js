import React from 'react';

// ── LoadingScreen ─────────────────────────────────────────────────────────────
export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-surface-400 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
