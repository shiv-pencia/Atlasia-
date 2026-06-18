import React from 'react';
import { Polyline } from 'react-leaflet';

export const RouteLayer = ({ points = [] }) => {
  if (points.length < 2) return null;

  // Resolve polyline path using either parsed GPS coordinates or fallback mock coordinates
  const positions = points.map((item, index) => {
    let lat = 35.0116 - index * 0.05;
    let lng = 135.7681 + index * 0.05;

    if (item.desc && item.desc.includes('GPS:')) {
      const match = item.desc.match(/GPS:\s*\(([-+]?\d*\.\d+|\d+),\s*([-+]?\d*\.\d+|\d+)\)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    return [lat, lng];
  });

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: 'hsl(190, 95%, 50%)', // Vibrant Cyan theme
        weight: 3,
        dashArray: '6, 6',
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  );
};

export default RouteLayer;
