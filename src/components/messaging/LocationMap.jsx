import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LocationMap = ({ location }) => {
  if (!location || !location.lat || !location.lng) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 my-2">
      <MapContainer
        key={`map-${location.lat}-${location.lng}`}
        center={[location.lat, location.lng]}
        zoom={13}
        style={{ height: '200px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]}>
          <Popup>
            {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
          </Popup>
        </Marker>
      </MapContainer>
      {location.address && (
        <div className="p-2 bg-white text-xs text-gray-700 border-t border-gray-200">
          📍 {location.address}
        </div>
      )}
    </div>
  );
};

export default LocationMap;
