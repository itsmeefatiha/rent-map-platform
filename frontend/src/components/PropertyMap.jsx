import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { calculateDistance, formatDistance, findNearestPOI } from '../utils/poiService';

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

const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
      background-color: #10B981;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

// Create POI icons
const createPOIIcon = (poiType) => {
  const colors = {
    hospital: '#DC2626', // Red
    restaurant: '#F59E0B', // Amber
    mosque: '#059669', // Green
    school: '#2563EB', // Blue
    supermarket: '#7C3AED', // Purple
  };
  
  const icons = {
    hospital: '🏥',
    restaurant: '🍽️',
    mosque: '🕌',
    school: '🏫',
    supermarket: '🛒',
  };

  return L.divIcon({
    className: 'poi-marker',
    html: `<div style="
      background-color: ${colors[poiType] || '#6B7280'};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">${icons[poiType] || '📍'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
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


export const PropertyMap = ({ 
  properties = [], 
  center, 
  zoom = 13, 
  onMarkerClick, 
  selectedPropertyId, 
  favoritePropertyIds = [], 
  userLocation = null,
  poiData = {},
  enabledPOITypes = {}
}) => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useLanguage();
  const mapRef = useRef(null);
  const [translatedTitles, setTranslatedTitles] = useState({});

  // Leaflet uses [latitude, longitude] format
  const defaultCenter = center || (properties.length > 0 
    ? [properties[0].latitude, properties[0].longitude] 
    : [33.5731, -7.5898]); // Default to Casablanca, Morocco instead of New York

  // Fonction pour traduire un texte
  const translateText = async (text, targetLang) => {
    if (!text) return text;
    
    const langCode = targetLang.split('-')[0];
    if (langCode === 'fr') {
      return text; // On suppose que les textes sont en français par défaut
    }

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0].map((item) => item[0]).join('');
      }
      return text;
    } catch (error) {
      return text;
    }
  };

  // Traduire les titres des propriétés quand la langue change
  useEffect(() => {
    const translateAllTitles = async () => {
      const translations = {};
      for (const property of properties) {
        if (property.title) {
          const translated = await translateText(property.title, i18n.language);
          translations[property.id] = translated;
        }
      }
      setTranslatedTitles(translations);
    };

    if (properties.length > 0) {
      translateAllTitles();
    } else {
      setTranslatedTitles({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, properties.map(p => p.id).join(',')]);

  const getIcon = (property) => {
    if (selectedPropertyId === property.id) {
      return createSelectedIcon();
    }
    if (favoritePropertyIds.includes(property.id)) {
      return createFavoriteIcon();
    }
    return createIcon(); // Primary color by default
  };

  // Get nearest POI distances for selected property
  const getNearestPOIDistances = (property) => {
    if (!property || !property.latitude || !property.longitude) return null;
    
    const lat = Number(property.latitude);
    const lng = Number(property.longitude);
    
    const distances = {};
    Object.keys(poiData).forEach(poiType => {
      if (enabledPOITypes[poiType] && poiData[poiType]?.length > 0) {
        const nearest = findNearestPOI(lat, lng, poiData[poiType]);
        if (nearest) {
          distances[poiType] = {
            name: nearest.name,
            distance: nearest.distance,
            formattedDistance: formatDistance(nearest.distance)
          };
        }
      }
    });
    
    return Object.keys(distances).length > 0 ? distances : null;
  };


  return (
    <div className="w-full h-full overflow-hidden transition-colors duration-300" style={{ position: 'relative', zIndex: 0 }}>
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
        {userLocation && (
          <Marker
            position={userLocation}
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div className="p-2">
                <p className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">{t('map.yourLocation')}</p>
              </div>
            </Popup>
          </Marker>
        )}
        {properties && properties.length > 0 && properties.map((property) => {
          // Ensure coordinates are valid and in correct format [lat, lng] for Leaflet
          if (!property.latitude || !property.longitude) return null;
          
          let lat = Number(property.latitude);
          let lng = Number(property.longitude);
          
          // Detect and fix swapped coordinates
          // Latitude should be between -90 and 90, longitude between -180 and 180
          // If lat is outside [-90, 90] but lng is within, they're likely swapped
          if ((lat < -90 || lat > 90) && (lng >= -90 && lng <= 90)) {
            // Coordinates are swapped, fix them
            [lat, lng] = [lng, lat];
            console.warn(`Fixed swapped coordinates for property ${property.id}`);
          }
          
          // Validate coordinates are within valid ranges
          if (isNaN(lat) || isNaN(lng) || 
              lat < -90 || lat > 90 || 
              lng < -180 || lng > 180) {
            console.warn(`Invalid coordinates for property ${property.id}:`, [lat, lng]);
            return null;
          }
          
          const position = [lat, lng];
          
          return (
            <Marker
              key={property.id}
              position={position}
              icon={getIcon(property)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(property),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm text-text-primary dark:text-text-primary-dark mb-1">
                    {translatedTitles[property.id] !== undefined ? translatedTitles[property.id] : property.title}
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-2">
                    {formatPrice(property.price)}/{property.rentalPeriod === 'DAY' ? t('property.perDay') : t('property.perMonth')}
                  </p>
                  
                  {/* Display nearest POI distances */}
                  {selectedPropertyId === property.id && (() => {
                    const nearestPOI = getNearestPOIDistances(property);
                    if (nearestPOI) {
                      return (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {t('map.distance')}:
                          </p>
                          <div className="space-y-1">
                            {nearestPOI.hospital && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span>🏥</span>
                                <span>{t('map.nearestHospital')}: {nearestPOI.hospital.formattedDistance}</span>
                              </div>
                            )}
                            {nearestPOI.restaurant && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span>🍽️</span>
                                <span>{t('map.nearestRestaurant')}: {nearestPOI.restaurant.formattedDistance}</span>
                              </div>
                            )}
                            {nearestPOI.mosque && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span>🕌</span>
                                <span>{t('map.nearestMosque')}: {nearestPOI.mosque.formattedDistance}</span>
                              </div>
                            )}
                            {nearestPOI.school && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span>🏫</span>
                                <span>{t('map.nearestSchool')}: {nearestPOI.school.formattedDistance}</span>
                              </div>
                            )}
                            {nearestPOI.supermarket && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span>🛒</span>
                                <span>{t('map.nearestSupermarket')}: {nearestPOI.supermarket.formattedDistance}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <Link
                    to={`/properties/${property.id}`}
                    className="text-xs text-primary dark:text-primary-light hover:underline mt-2 inline-block"
                  >
                    {t('property.viewDetails')}
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Display POI markers */}
        {Object.keys(poiData).map(poiType => {
          if (!enabledPOITypes[poiType] || !poiData[poiType]) return null;
          
          return poiData[poiType].map((poi) => (
            <Marker
              key={`${poiType}-${poi.id}`}
              position={poi.position}
              icon={createPOIIcon(poiType)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm text-text-primary dark:text-text-primary-dark mb-1">
                    {poi.name}
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
                    {t(`map.${poiType === 'mosque' ? 'mosques' : poiType + 's'}`)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ));
        })}
      </MapContainer>
    </div>
  );
};
