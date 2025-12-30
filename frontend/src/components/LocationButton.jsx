import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const LocationButton = ({ onLocationFound, className = "" }) => {
  const { t } = useTranslation();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('map.geolocationNotSupported'));
      setTimeout(() => setLocationError(null), 5000);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    // Try with high accuracy first, then fallback to lower accuracy
    const tryGetLocation = (options, attempt = 1) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setIsLocating(false);
          setLocationError(null);
          if (onLocationFound) {
            onLocationFound([latitude, longitude]);
          }
        },
        (error) => {
          // If timeout and we haven't tried with lower accuracy, try again
          if (error.code === error.TIMEOUT && attempt === 1 && options.enableHighAccuracy) {
            // Retry with lower accuracy and longer timeout
            tryGetLocation({
              enableHighAccuracy: false,
              timeout: 30000,
              maximumAge: 60000 // Accept cached position up to 1 minute old
            }, 2);
          } else {
            setIsLocating(false);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setLocationError(t('map.locationPermissionDenied'));
                break;
              case error.POSITION_UNAVAILABLE:
                setLocationError(t('map.locationUnavailable'));
                break;
              case error.TIMEOUT:
                setLocationError(t('map.locationTimeout'));
                break;
              default:
                setLocationError(t('map.locationError'));
                break;
            }
            // Clear error message after 5 seconds
            setTimeout(() => setLocationError(null), 5000);
          }
        },
        options
      );
    };

    // First attempt with high accuracy
    tryGetLocation({
      enableHighAccuracy: true,
      timeout: 15000, // Increased from 10 to 15 seconds
      maximumAge: 0
    });
  };

  return (
    <>
      <button
        onClick={getUserLocation}
        disabled={isLocating}
        className={`bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={t('map.findMyLocation')}
      >
        {isLocating ? (
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
      {locationError && (
        <div className="absolute top-16 right-4 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs">
          {locationError}
        </div>
      )}
    </>
  );
};



