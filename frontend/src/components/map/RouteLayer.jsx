import React from 'react';

export const RouteLayer = ({ points = [] }) => {
  if (points.length < 2) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1
    }}>
      {/* Visual route indicator */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        border: '1px dashed hsla(var(--secondary), 0.3)',
        borderRadius: '50%',
        width: '80%',
        height: '80%',
        animation: 'spin 120s linear infinite'
      }} />
      
      <style>{`
        @keyframes spin {
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RouteLayer;
