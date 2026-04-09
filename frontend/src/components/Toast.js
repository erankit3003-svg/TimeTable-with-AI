import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

let toastId = 0;
let externalAdd = null;

export const toast = {
  success: (msg) => externalAdd?.({ type: 'success', msg }),
  error: (msg) => externalAdd?.({ type: 'error', msg }),
  warning: (msg) => externalAdd?.({ type: 'warning', msg }),
  info: (msg) => externalAdd?.({ type: 'info', msg }),
};

const ICONS = {
  success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

const COLORS = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type, msg }) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-4), { id, type, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    externalAdd = addToast;
    return () => { externalAdd = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      pointerEvents: 'none', maxWidth: '360px', width: '100%'
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: '8px', padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            animation: 'toastIn 0.25s ease-out',
            pointerEvents: 'auto',
            fontSize: '0.8125rem', fontWeight: 500, color: c.text,
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {ICONS[t.type]}
            <span>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
