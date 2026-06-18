import React from 'react';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import L from 'leaflet';

export const Marker = ({ position, title, index }) => {
  if (!position) return null;

  // Create a custom Leaflet divIcon that renders the circular index badge
  const customIcon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(190, 95%, 50%) 0%, hsl(247, 85%, 60%) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.8rem;
        font-weight: bold;
        color: white;
        box-shadow: 0 0 10px rgba(0, 242, 254, 0.6);
        border: 2px solid white;
        text-align: center;
        line-height: 24px;
      ">
        ${index}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <LeafletMarker position={[position.lat, position.lng]} icon={customIcon}>
      <Popup>
        <div style={{ color: '#111', fontSize: '0.8rem', padding: '0.2rem', fontFamily: 'system-ui' }}>
          <strong style={{ display: 'block', marginBottom: '0.1rem' }}>Activity {index}</strong>
          <span>{title}</span>
        </div>
      </Popup>
    </LeafletMarker>
  );
};

export default Marker;
