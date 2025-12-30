import React from 'react';
import { useTranslation } from 'react-i18next';

export const POIControls = ({ enabledTypes, onToggle, className = '' }) => {
  const { t } = useTranslation();

  const poiTypes = [
    { key: 'hospital', icon: '🏥', label: t('map.hospitals') },
    { key: 'restaurant', icon: '🍽️', label: t('map.restaurants') },
    { key: 'mosque', icon: '🕌', label: t('map.mosques') },
    { key: 'school', icon: '🏫', label: t('map.schools') },
    { key: 'supermarket', icon: '🛒', label: t('map.supermarkets') },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {t('map.showPOI')}
      </h3>
      <div className="space-y-2">
        {poiTypes.map(({ key, icon, label }) => (
          <label
            key={key}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={enabledTypes[key] || false}
              onChange={() => onToggle(key)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-lg">{icon}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

