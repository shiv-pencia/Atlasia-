import React from 'react';

export const MapView = ({ center, zoom = 12, children, style = {} }) => {
  return (
    <div style={{
      flex: 1,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      position: 'relative',
      background: 'rgb(24, 28, 41)',
      backgroundImage: 'radial-gradient(hsla(var(--primary), 0.15) 1px, transparent 0)',
      backgroundSize: '24px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}>
      {/* Background grid details */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'hsl(var(--text-muted))',
        backdropFilter: 'blur(4px)',
        zIndex: 5
      }}>
        Zoom: {zoom}x | Lat: {center?.lat?.toFixed(4) || '0'}, Lng: {center?.lng?.toFixed(4) || '0'}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4rem',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        width: '100%'
      }}>
        {children}
      </div>
    </div>
  );
};

export default MapView;
