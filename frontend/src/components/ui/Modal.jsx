import React, { useEffect } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px'
}) => {
  // Prevent scrolling behind modal when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth,
          padding: '2rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}
        onClick={(e) => e.stopPropagation()} // Avoid closing when clicking inside
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">{title}</h3>}
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: '0.2rem'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'hsl(var(--text-muted))'}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
