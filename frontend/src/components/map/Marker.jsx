import React from 'react';

export const Marker = ({ position, title, index }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--primary)) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 0 10px hsla(var(--secondary), 0.5)'
      }}>
        {index}
      </div>
      <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 600 }}>{title}</span>
        {position && (
          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginLeft: '0.5rem' }}>
            ({position.lat?.toFixed(2)}, {position.lng?.toFixed(2)})
          </span>
        )}
      </div>
    </div>
  );
};

export default Marker;
