import React, { useState } from 'react';

export const LikeButton = ({ isLiked, onToggle, size = 'md', showCount = false, count = 0 }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8'
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }
    
    onToggle && onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className="relative focus:outline-none focus:ring-0 transition-transform active:scale-90 flex items-center gap-2 group"
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <div className="relative">
        {/* Heart Icon - Instagram style */}
        <svg
          className={`${iconSize} transition-all duration-300 ease-out ${
            isLiked
              ? 'text-red-500 fill-red-500'
              : 'text-gray-900 dark:text-gray-100 fill-transparent group-hover:opacity-70'
          } ${isAnimating ? 'scale-150' : 'scale-100'}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isLiked ? 0 : 2}
          fill={isLiked ? 'currentColor' : 'none'}
          style={{
            filter: isLiked ? 'none' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>

        {/* Pulse animation on like */}
        {isAnimating && isLiked && (
          <div
            className="absolute inset-0 rounded-full bg-red-500 opacity-40 animate-ping"
            style={{
              animationDuration: '0.4s',
            }}
          />
        )}
      </div>

      {/* Optional count display */}
      {showCount && (
        <span className={`text-sm font-semibold transition-colors ${
          isLiked 
            ? 'text-red-500' 
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

