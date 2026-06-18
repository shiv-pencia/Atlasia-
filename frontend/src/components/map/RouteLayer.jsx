import React from 'react';
import { Polyline } from 'react-leaflet';

export const RouteLayer = ({ points = [] }) => {
  if (points.length < 2) return null;

  // Map the itinerary items to mock coordinates centered around Kyoto coordinates
  const positions = points.slice(0, 3).map((item, index) => [
    35.0116 - index * 0.05,
    135.7681 + index * 0.05
  ]);

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
