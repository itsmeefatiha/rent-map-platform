import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertiesApi } from '../api/properties';
import { favoritesApi } from '../api/favorites';
import { reviewsApi } from '../api/reviews';
import { useAuth } from '../context/AuthContext';

export const PropertyDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadProperty();
    loadReviews();
    if (user && user.role === 'TENANT') {
      checkFavorite();
    }
  }, [id, user]);

  const loadProperty = async () => {
    try {
      const data = await propertiesApi.getById(id);
      setProperty(data);
    } catch (error) {
      console.error('Failed to load property:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      if (property?.ownerId) {
        const data = await reviewsApi.getByOwner(property.ownerId);
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const checkFavorite = async () => {
    try {
      const result = await favoritesApi.check(id);
      setIsFavorite(result);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || user.role !== 'TENANT') {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await favoritesApi.remove(id);
      } else {
        await favoritesApi.add(id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewsApi.create(property.ownerId, reviewData);
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
      loadReviews();
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">Property not found</div>
      </div>
    );
  }

  const getImages = () => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      return property.imageUrls.map(url => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return `http://localhost:8080${url}`;
      });
    }
    return [`https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=800`];
  };

  const images = getImages();

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark py-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              <img
                src={images[currentImageIndex]}
                alt={property.title}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=800`;
                }}
              />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${property.title} ${index + 1}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-full h-20 object-cover rounded cursor-pointer ${
                        currentImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=200`;
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                  {property.title}
                </h1>
                {user && user.role === 'TENANT' && (
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-full transition-all ${
                      isFavorite
                        ? 'bg-error text-white'
                        : 'bg-border dark:bg-border-dark text-text-secondary dark:text-text-secondary-dark'
                    }`}
                  >
                    {isFavorite ? '❤️' : '🤍'}
                  </button>
                )}
              </div>
              <p className="text-3xl font-bold text-primary dark:text-primary-light mb-4">
                ${property.price.toLocaleString()}
              </p>
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Area</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.area} sqft</p>
                  </div>
                  {property.propertyType && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.propertyType}</p>
                    </div>
                  )}
                  {property.numberOfBedrooms && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bedrooms</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.numberOfBedrooms}</p>
                    </div>
                  )}
                  {property.numberOfBathrooms && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bathrooms</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.numberOfBathrooms}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold">Region:</span> {property.region}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold">Availability:</span>{' '}
                    {new Date(property.availability).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Owner:</span> {property.ownerName}
                  </p>
                </div>
                {(property.hasWifi || property.hasParking || property.hasAirConditioning || 
                  property.hasHeating || property.hasFurnished || property.petsAllowed) && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {property.hasWifi && (
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                          </svg>
                          WiFi
                        </span>
                      )}
                      {property.hasParking && (
                        <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Parking
                        </span>
                      )}
                      {property.hasAirConditioning && (
                        <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                          AC
                        </span>
                      )}
                      {property.hasHeating && (
                        <span className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Heating
                        </span>
                      )}
                      {property.hasFurnished && (
                        <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Furnished
                        </span>
                      )}
                      {property.petsAllowed && (
                        <span className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Pets Allowed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {property.description}
              </p>
              <Link
                to={`/chat/${property.ownerId}`}
                className="btn-primary inline-block"
              >
                Contact Owner
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Reviews</h2>
            {user && user.role === 'TENANT' && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary"
              >
                Write Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-bg dark:bg-bg-dark rounded-lg border border-border dark:border-border-dark">
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Rating
                </label>
                <select
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} Star{r > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Comment
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  rows={4}
                  className="input-field"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewData({ rating: 5, comment: '' });
                  }}
                  className="px-4 py-2 bg-text-secondary dark:bg-text-secondary-dark hover:opacity-80 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-text-secondary dark:text-text-secondary-dark">No reviews yet</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-border dark:border-border-dark pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-text-primary dark:text-text-primary-dark">
                        {review.tenantName}
                      </p>
                      <p className="text-accent">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </p>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="text-text-primary dark:text-text-primary-dark">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

