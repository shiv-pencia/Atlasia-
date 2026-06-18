import React from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';

// Internal helper component to hook Leaflet map events
const MapEvents = ({ onClick }) => {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng);
      }
    }
  });
  return null;
};

// Internal helper component to auto-fit map bounds dynamically
const MapBoundsFitter = ({ coords }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (coords && coords.length > 0) {
      // Format coordinates into [lat, lng] arrays for Leaflet's bounds
      const bounds = coords.map(c => [c.lat || c[0], c.lng || c[1]]);
      if (bounds.length === 1) {
        map.setView(bounds[0], 12);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [coords, map]);
  
  return null;
};

export const MapView = ({ center, zoom = 12, children, style = {}, onMapClick, boundsCoords }) => {
  // Convert center object { lat, lng } to array [lat, lng] for Leaflet
  const mapCenter = center ? [center.lat, center.lng] : [35.0116, 135.7681];

  // Separate Leaflet components (Marker, RouteLayer) from plain HTML overlays
  const leafletElements = [];
  const overlayElements = [];

  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (child.type && (child.type.name === 'Marker' || child.type.name === 'RouteLayer' || child.type.name === 'Polyline')) {
      leafletElements.push(child);
    } else {
      overlayElements.push(child);
    }
  });

  return (
    <div style={{
      flex: 1,
      height: '100%',
      width: '100%',
      minHeight: '380px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      position: 'relative',
      ...style
    }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapEvents onClick={onMapClick} />
        <MapBoundsFitter coords={boundsCoords} />
        {leafletElements}
      </MapContainer>

      {/* Render HTML overlays on top of the Map */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {overlayElements}
      </div>
    </div>
  );
};

export default MapView;
