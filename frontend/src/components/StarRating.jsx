import React from 'react';

export const StarRating = ({ rating, maxRating = 5, size = 'md', showRating = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const isFilled = index < rating;
          return (
            <svg
              key={index}
              className={`${starSize} ${isFilled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{
                filter: isFilled ? 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        })}
      </div>
      {showRating && (
        <span className="ml-2 text-sm font-semibold text-text-primary dark:text-text-primary-dark">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export const InteractiveStarRating = ({ rating, maxRating = 5, onRatingChange, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const starSize = sizeClasses[size] || sizeClasses.lg;
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        const isHovered = hoverRating === starValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onRatingChange && onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
          >
            <svg
              className={`${starSize} ${isFilled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} transition-all`}
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{
                filter: isFilled 
                  ? `drop-shadow(0 0 ${isHovered ? '5px' : '3px'} rgba(251, 191, 36, ${isHovered ? '1' : '0.8'})) drop-shadow(0 0 ${isHovered ? '8px' : '6px'} rgba(251, 191, 36, ${isHovered ? '0.6' : '0.4'}))`
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};



