import React from 'react';
import { Link } from 'react-router-dom';

export const PropertyCard = ({ property }) => {
  const getImageUrl = () => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      const url = property.imageUrls[0];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `http://localhost:8080${url}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=400`;
  };

  const imageUrl = getImageUrl();

  return (
    <Link to={`/properties/${property.id}`}>
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
              ${property.price?.toLocaleString()}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors line-clamp-1">
            {property.title}
          </h3>
          <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border-dark">
            <div className="flex items-center space-x-2 text-text-secondary dark:text-text-secondary-dark">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-sm font-medium">{property.area} sqft</span>
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
