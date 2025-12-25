import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Create custom icons with theme colors
const createIcon = (color = '#2563EB') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const createSelectedIcon = () => {
  return createIcon('#F97316'); // Accent color for selected
};

const createFavoriteIcon = () => {
  return createIcon('#EF4444'); // Red for favorites
};

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

export const PropertyMap = ({ properties = [], center, zoom = 13, onMarkerClick, selectedPropertyId, favoritePropertyIds = [] }) => {
  const mapRef = useRef(null);

  const defaultCenter = center || (properties.length > 0 
    ? [properties[0].latitude, properties[0].longitude] 
    : [40.7128, -74.0060]);

  const getIcon = (property) => {
    if (selectedPropertyId === property.id) {
      return createSelectedIcon();
    }
    if (favoritePropertyIds.includes(property.id)) {
      return createFavoriteIcon();
    }
    return createIcon(); // Primary color by default
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border dark:border-border-dark transition-colors duration-300" style={{ position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        ref={mapRef}
        scrollWheelZoom={true}
        key={defaultCenter.join(',')}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <MapUpdater center={center} zoom={zoom} />}
        {properties && properties.length > 0 && properties.map((property) => (
          property.latitude && property.longitude && (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              icon={getIcon(property)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(property),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm text-text-primary dark:text-text-primary-dark mb-1">{property.title}</h3>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-2">${property.price?.toLocaleString()}</p>
                  <Link
                    to={`/properties/${property.id}`}
                    className="text-xs text-primary dark:text-primary-light hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};
