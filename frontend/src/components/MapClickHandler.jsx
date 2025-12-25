import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

export const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
};

