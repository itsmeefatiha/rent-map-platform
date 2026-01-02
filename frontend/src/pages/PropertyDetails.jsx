import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '../api/properties';
import { favoritesApi } from '../api/favorites';
import { propertyCommentsApi } from '../api/propertyComments';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StarRating, InteractiveStarRating } from '../components/StarRating';
import { PropertyCommentCard } from '../components/PropertyCommentCard';
import { LikeButton } from '../components/LikeButton';

export const PropertyDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const { formatPrice } = useLanguage();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [comments, setComments] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentData, setCommentData] = useState({ rating: 5, comment: '' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [translatingDescription, setTranslatingDescription] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatingTitle, setTranslatingTitle] = useState(false);

  const translatePropertyType = (type) => {
    if (!type) return '';
    const typeKey = type.toLowerCase();
    const translationKey = `property.${typeKey}`;
    const translated = t(translationKey);
    // Si la traduction retourne la clé, c'est qu'elle n'existe pas, on retourne le type original
    return translated !== translationKey ? translated : type;
  };

  // Fonction pour traduire un texte
  const translateText = async (text, targetLang, setTranslating) => {
    if (!text) return text;
    
    // Si la langue cible est la même que la langue source (français), pas besoin de traduire
    const langCode = targetLang.split('-')[0];
    if (langCode === 'fr') {
      return text; // On suppose que les textes sont en français par défaut
    }

    try {
      if (setTranslating) setTranslating(true);
      // Utiliser l'API Google Translate gratuite via le navigateur
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0].map((item) => item[0]).join('');
      }
      return text;
    } catch (error) {
      console.warn('Translation failed, using original text:', error);
      return text;
    } finally {
      if (setTranslating) setTranslating(false);
    }
  };

  // Fonction pour traduire la description
  const translateDescription = async (text, targetLang) => {
    return translateText(text, targetLang, setTranslatingDescription);
  };

  // Fonction pour traduire le titre
  const translateTitle = async (text, targetLang) => {
    return translateText(text, targetLang, setTranslatingTitle);
  };

  // Traduire la description quand la langue ou la propriété change
  useEffect(() => {
    if (property?.description) {
      translateDescription(property.description, i18n.language).then(setTranslatedDescription);
    } else {
      setTranslatedDescription(null);
    }
  }, [property?.description, i18n.language]);

  // Traduire le titre quand la langue ou la propriété change
  useEffect(() => {
    if (property?.title) {
      translateTitle(property.title, i18n.language).then(setTranslatedTitle);
    } else {
      setTranslatedTitle(null);
    }
  }, [property?.title, i18n.language]);

  useEffect(() => {
    loadProperty();
    if (user && user.role === 'TENANT') {
      checkFavorite();
    }
  }, [id, user]);

  useEffect(() => {
    if (property?.id) {
      loadComments();
    }
  }, [property?.id]);

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

  const loadComments = async () => {
    try {
      if (property?.id) {
        const data = await propertyCommentsApi.getByProperty(property.id);
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleCommentUpdate = () => {
    loadComments();
    loadProperty(); // Refresh to get updated average rating
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
      setShowLoginModal(true);
      return;
    }

    // Optimistic update for better UX
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (previousState) {
        await favoritesApi.remove(id);
      } else {
        await favoritesApi.add(id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      setIsFavorite(previousState);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await propertyCommentsApi.create(property.id, commentData);
      setShowCommentForm(false);
      setCommentData({ rating: 5, comment: '' });
      handleCommentUpdate();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert(t('property.failedToSubmit'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">{t('common.loading')}</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">{t('property.propertyNotFound')}</div>
      </div>
    );
  }

  // Helper function to detect if URL is a video based on extension
  const isVideo = (url) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  const getMedia = () => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      return property.imageUrls.map(url => {
        const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
          ? url 
          : `http://localhost:8080${url}`;
        return {
          url: fullUrl,
          type: isVideo(fullUrl) ? 'video' : 'image'
        };
      });
    }
    return [{
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=800`,
      type: 'image'
    }];
  };

  const media = getMedia();
  const currentMedia = media[currentImageIndex];

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark py-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div className="relative">
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  className="w-full h-96 object-cover rounded-lg"
                  controls
                  playsInline
                >
                  {t('property.videoNotSupported')}
                </video>
              ) : (
                <img
                  src={currentMedia.url}
                  alt={property.title}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=800`;
                  }}
                />
              )}
              {/* Instagram-style action buttons overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Like button */}
                  <div className="bg-black/50 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-black/70 transition-all cursor-pointer">
                    <LikeButton
                      isLiked={isFavorite}
                      onToggle={toggleFavorite}
                      size="lg"
                    />
                  </div>
                  
                  {/* Comment button */}
                  <button
                    onClick={() => {
                      setShowComments(!showComments);
                      if (!showComments) {
                        setTimeout(() => {
                          document.getElementById('comments-section')?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }
                    }}
                    className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2.5 rounded-full text-white hover:bg-black/70 hover:scale-110 transition-all shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {property.totalComments > 0 && (
                      <span className="text-sm font-bold">
                        {property.totalComments}
                      </span>
                    )}
                  </button>
                  
                  {/* Contact Owner button */}
                  {user ? (
                    <Link
                      to={`/chat/${property.ownerId}`}
                      className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2.5 rounded-full text-white hover:bg-black/70 hover:scale-110 transition-all shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2.5 rounded-full text-white hover:bg-black/70 hover:scale-110 transition-all shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {media.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {media.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-full h-20 rounded cursor-pointer overflow-hidden ${
                        currentImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {item.type === 'video' ? (
                        <>
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.url}
                          alt={`${property.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.title || 'Property')}&background=4f46e5&color=fff&size=200`;
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                  {translatedTitle !== null ? translatedTitle : property.title}
                </h1>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-3xl font-bold text-primary dark:text-primary-light">
                  {formatPrice(property.price)}/{property.rentalPeriod === 'DAY' ? t('property.perDay') : t('property.perMonth')}
                </p>
                {property.averageRating && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(property.averageRating)} size="md" showRating />
                    <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                      ({property.totalComments || 0} {property.totalComments === 1 ? t('property.review') : t('property.reviewsPlural')})
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('property.area')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.area} {t('property.sqftUnit')}</p>
                  </div>
                  {property.propertyType && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('property.type')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{translatePropertyType(property.propertyType)}</p>
                    </div>
                  )}
                  {property.numberOfBedrooms && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('property.bedrooms')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.numberOfBedrooms}</p>
                    </div>
                  )}
                  {property.numberOfBathrooms && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('property.bathrooms')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.numberOfBathrooms}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold">{t('property.regionLabel')}:</span> {property.region}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold">{t('property.availability')}:</span>{' '}
                    {new Date(property.availability).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{t('property.owner')}:</span> {property.ownerName}
                  </p>
                </div>
                {(property.hasWifi || property.hasParking || property.hasAirConditioning || 
                  property.hasHeating || property.hasFurnished || property.petsAllowed) && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('property.amenities')}</p>
                    <div className="flex flex-wrap gap-2">
                      {property.hasWifi && (
                        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                          </svg>
                          {t('property.wifi')}
                        </span>
                      )}
                      {property.hasParking && (
                        <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('property.parking')}
                        </span>
                      )}
                      {property.hasAirConditioning && (
                        <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                          {t('property.airConditioning')}
                        </span>
                      )}
                      {property.hasHeating && (
                        <span className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {t('property.heating')}
                        </span>
                      )}
                      {property.hasFurnished && (
                        <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {t('property.furnished')}
                        </span>
                      )}
                      {property.petsAllowed && (
                        <span className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {t('property.petsAllowed')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('property.description')}
                </h3>
                {translatingDescription ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm">{t('common.loading')}...</span>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {translatedDescription !== null ? translatedDescription : property.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section - Instagram style */}
        {showComments && (
          <div id="comments-section" className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('property.comments')}
                  </h2>
                  {property.averageRating && (
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(property.averageRating)} size="sm" showRating />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({property.totalComments || 0})
                      </span>
                    </div>
                  )}
                </div>
                {user && !showCommentForm && (
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                        return;
                      }
                      setShowCommentForm(true);
                    }}
                    className="text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {t('property.addComment')}
                  </button>
                )}
              </div>
            </div>

            {/* Comment Form - Instagram style */}
            {showCommentForm && (
              <form onSubmit={handleCommentSubmit} className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('property.rating')}
                  </label>
                  <InteractiveStarRating
                    rating={commentData.rating}
                    onRatingChange={(rating) => setCommentData({ ...commentData, rating })}
                    size="md"
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    value={commentData.comment}
                    onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                    rows={3}
                    placeholder={t('property.addCommentPlaceholder')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentForm(false);
                      setCommentData({ rating: 5, comment: '' });
                    }}
                    className="px-4 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!commentData.comment?.trim()}
                    className="px-4 py-1.5 text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('property.post')}
                  </button>
                </div>
              </form>
            )}

            {/* Comments List - Instagram style */}
            <div className="p-4 max-h-[600px] overflow-y-auto">
              <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
              {comments.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
                    {t('property.noComments')}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    {t('property.beFirstToShare')}
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <PropertyCommentCard 
                    key={comment.id} 
                    comment={comment} 
                    onUpdate={handleCommentUpdate}
                    onShowLoginModal={() => setShowLoginModal(true)}
                  />
                ))
              )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('property.loginRequired')}
                </h3>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('property.loginRequiredMessage')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate('/login');
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary dark:bg-primary-light rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('common.login')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

