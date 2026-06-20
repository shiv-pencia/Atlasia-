import React from 'react';
import { useToastStore } from '../../store/toastStore';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            minWidth: '280px',
            maxWidth: '400px',
            background: 'rgba(26, 29, 38, 0.85)',
            borderLeft: toast.type === 'error' ? '4px solid hsl(var(--color-danger))' : '4px solid hsl(var(--secondary))',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), var(--glow-shadow)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            color: 'white'
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'hsl(var(--text-muted))'}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
