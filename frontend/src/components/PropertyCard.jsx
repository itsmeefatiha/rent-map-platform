import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StarRating } from './StarRating';
import { recommendationsApi } from '../api/recommendations';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const PropertyCard = ({ property }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { formatPrice } = useLanguage();
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);

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

  // Traduire la description quand la langue ou la propriété change
  useEffect(() => {
    if (property?.description) {
      translateText(property.description, i18n.language).then(setTranslatedDescription);
    } else {
      setTranslatedDescription(null);
    }
  }, [property?.description, i18n.language]);

  // Traduire le titre quand la langue ou la propriété change
  useEffect(() => {
    if (property?.title) {
      translateText(property.title, i18n.language).then(setTranslatedTitle);
    } else {
      setTranslatedTitle(null);
    }
  }, [property?.title, i18n.language]);
  
  // Helper function to detect if URL is a video based on extension
  const isVideo = (url) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  const getImageUrl = () => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      // Try to find the first image (not video) for thumbnail
      const imageUrl = property.imageUrls.find(url => !isVideo(url)) || property.imageUrls[0];
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      return `http://localhost:8080${imageUrl}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=400`;
  };

  const imageUrl = getImageUrl();

  const handleClick = () => {
    // Enregistrer l'interaction CLICK si l'utilisateur est un tenant
    if (user && user.role === 'TENANT' && property?.id) {
      recommendationsApi.recordInteraction(property.id, 'CLICK').catch(err => {
        console.warn('Failed to record interaction:', err);
      });
    }
  };

  return (
    <Link to={`/properties/${property.id}`} onClick={handleClick}>
      <div className="group card hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02]">
        <div className="relative overflow-hidden">
          <img 
            src={imageUrl} 
            alt={property.title}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=400`;
            }}
          />
          <div className="absolute top-4 right-4 bg-surface dark:bg-surface-dark/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
            <span className="text-sm font-bold text-primary dark:text-primary-light">
              {formatPrice(property.price)}/{property.rentalPeriod === 'DAY' ? t('property.perDay') : t('property.perMonth')}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors line-clamp-1">
            {translatedTitle !== null ? translatedTitle : property.title}
          </h3>
          {property.averageRating && (
            <div className="mb-2">
              <StarRating rating={Math.round(property.averageRating)} size="sm" />
            </div>
          )}
          <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4 line-clamp-2 leading-relaxed">
            {translatedDescription !== null ? translatedDescription : property.description}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border-dark">
            <div className="flex items-center space-x-2 text-text-secondary dark:text-text-secondary-dark">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-sm font-medium">{property.area} {t('property.sqftUnit')}</span>
            </div>
            <div className="flex items-center space-x-2 text-text-secondary dark:text-text-secondary-dark">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">{property.region}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
