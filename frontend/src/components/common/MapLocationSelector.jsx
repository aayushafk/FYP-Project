import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
// Only run once when module loads
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Component to handle map clicks and place marker
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  useEffect(() => {
    if (position && map) {
      map.flyTo([position.lat, position.lng], 13);
    }
  }, [position, map]);

  return position === null ? null : <Marker position={[position.lat, position.lng]} />;
}

/**
 * MapLocationSelector - A reusable component for selecting location from a map
 * @param {Object} position - Current position { lat, lng }
 * @param {Function} onLocationSelect - Callback when location is selected
 * @param {Number} height - Map container height in pixels (default: 400)
 * @param {Array} center - Initial map center [lat, lng] (default: Nepal center)
 * @param {Number} zoom - Initial zoom level (default: 7)
 */
const MapLocationSelector = ({ 
  position, 
  onLocationSelect, 
  height = 400,
  center = [28.3949, 84.1240], // Nepal center coordinates
  zoom = 7
}) => {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's current location using browser geolocation
  const handleUseCurrentLocation = () => {
    setLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({ lat: latitude, lng: longitude });
        setLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
        
        setLocationError(errorMessage);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Don't render map on server or before hydration
  if (!mounted) {
    return (
      <div 
        className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center" 
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instructions and Use Current Location Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-blue-600" />
          <span>Click on the map to select your location</span>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Navigation size={16} />
          {locating ? 'Locating...' : 'Use My Location'}
        </button>
      </div>

      {/* Error Message */}
      {locationError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {locationError}
        </div>
      )}

      {/* Map Container */}
      <div 
        className="border border-gray-300 rounded-lg overflow-hidden shadow-sm" 
        style={{ height: `${height}px` }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker position={position} setPosition={onLocationSelect} />
        </MapContainer>
      </div>

      {/* Selected Location Display */}
      {position && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
          <MapPin size={16} />
          <span>
            Location selected: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
};

export default MapLocationSelector;
