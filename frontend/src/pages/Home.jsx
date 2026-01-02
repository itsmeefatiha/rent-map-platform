import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PropertyMap } from '../components/PropertyMap';
import { LocationButton } from '../components/LocationButton';
import { propertiesApi } from '../api/properties';
import { statisticsApi } from '../api/statistics';
import { useAuth } from '../context/AuthContext';
import { getCityImage, cityImages } from '../utils/cityImages';

export const Home = () => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [statistics, setStatistics] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalCities: 0,
    satisfactionRate: 0
  });
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProperties();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProperties = async () => {
    try {
      setError(null);
      // Charger toutes les propriétés comme sur la carte (pour locataires)
      const propertiesData = await propertiesApi.getAllForMap();
      setAllProperties(propertiesData); // Stocker toutes les propriétés
      setProperties(propertiesData.slice(0, 6)); // Garder seulement 6 pour la carte de prévisualisation
      
      // Extraire les villes uniques avec le nombre de propriétés
      const cityMap = new Map();
      propertiesData.forEach(property => {
        if (property.region) {
          const city = property.region;
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });
      
      // Convertir en tableau et trier par nombre de propriétés (décroissant)
      const citiesArray = Array.from(cityMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // Limiter à 4 villes pour l'affichage
      
      setCities(citiesArray);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setError(error.message || 'Erreur lors du chargement des propriétés');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir les images des villes principales pour le hero
  const heroImages = useMemo(() => {
    // Obtenir les images des villes principales depuis cityImages
    const mainCities = ['Casablanca', 'Marrakech', 'Rabat', 'Tanger', 'Fès', 'Agadir'];
    return mainCities
      .filter(city => cityImages[city])
      .map(city => ({ name: city, image: cityImages[city] }));
  }, []);

  // Rotation automatique des images
  useEffect(() => {
    if (heroImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000); // Change d'image toutes les 5 secondes

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const loadStatistics = async () => {
    try {
      console.log('Loading statistics...');
      const stats = await statisticsApi.getStatistics();
      console.log('Statistics loaded:', stats);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      console.error('Error details:', error.message);
      // En cas d'erreur, on garde les valeurs par défaut (0)
      // Mais on affiche un message pour aider au débogage
      setError(error.message || 'Erreur lors du chargement des statistiques');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Erreur de connexion</h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadProperties}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden h-[600px] md:h-[700px]">
        {/* Images dynamiques en arrière-plan */}
        <div className="absolute inset-0">
          {heroImages.length > 0 ? (
            <>
              {/* Toutes les images avec transition de fade */}
              {heroImages.map((item, index) => (
                <div
                  key={item.name}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop';
                    }}
                  />
                </div>
              ))}
              {/* Overlay sombre pour la lisibilité */}
              <div className="absolute inset-0 bg-black/50 z-20"></div>
              {/* Dégradé en bas */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-20"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary-dark"></div>
          )}
        </div>

        {/* Contenu au-dessus */}
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
              {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              {t('home.subtitle')}
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-white hover:bg-white/90 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('home.getStarted')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Indicateurs de navigation des images */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Image ${index + 1}: ${heroImages[index]?.name}`}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg dark:from-bg-dark to-transparent z-20 pointer-events-none"></div>
      </div>

      {/* Stats Section */}
      <div className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stats 1: Satisfaction Rate */}
          <div className="card text-center p-6 bg-surface dark:bg-surface-dark">
            <div className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-light mb-2">
              {statistics.satisfactionRate > 0 ? `${Math.round(statistics.satisfactionRate)}%` : '0%'}
            </div>
            <div className="text-sm md:text-base text-text-secondary dark:text-text-secondary-dark">
              {t('home.stats4')}
            </div>
          </div>
          {/* Stats 2: Regions Covered */}
          <div className="card text-center p-6 bg-surface dark:bg-surface-dark">
            <div className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-light mb-2">
              {statistics.totalCities > 0 ? `${statistics.totalCities}+` : '0'}
            </div>
            <div className="text-sm md:text-base text-text-secondary dark:text-text-secondary-dark">
              {t('home.stats3')}
            </div>
          </div>
          {/* Stats 3: Satisfied Users */}
          <div className="card text-center p-6 bg-surface dark:bg-surface-dark">
            <div className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-light mb-2">
              {statistics.totalUsers > 0 ? (statistics.totalUsers >= 1000 ? `${(statistics.totalUsers / 1000).toFixed(1)}K+` : statistics.totalUsers) : '0'}
            </div>
            <div className="text-sm md:text-base text-text-secondary dark:text-text-secondary-dark">
              {t('home.stats2')}
            </div>
          </div>
          {/* Stats 4: Active Properties */}
          <div className="card text-center p-6 bg-surface dark:bg-surface-dark">
            <div className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-light mb-2">
              {statistics.totalProperties > 0 ? (statistics.totalProperties >= 500 ? `${statistics.totalProperties}+` : statistics.totalProperties) : '0'}
            </div>
            <div className="text-sm md:text-base text-text-secondary dark:text-text-secondary-dark">
              {t('home.stats1')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Features Section */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              {t('home.featuresTitle')}
            </h2>
            <p className="text-lg md:text-xl text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto">
              {t('home.featuresSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="card p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <svg className="w-7 h-7 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('home.feature1Title')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('home.feature1Desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <svg className="w-7 h-7 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('home.feature2Title')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('home.feature2Desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <svg className="w-7 h-7 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('home.feature3Title')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('home.feature3Desc')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <svg className="w-7 h-7 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('home.feature4Title')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('home.feature4Desc')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <svg className="w-7 h-7 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('home.feature5Title')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('home.feature5Desc')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <svg className="w-7 h-7 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('home.feature6Title')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('home.feature6Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              {t('home.howItWorksTitle')}
            </h2>
            <p className="text-lg md:text-xl text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto">
              {t('home.howItWorksSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-primary dark:bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  1
                </div>
              </div>
              <div className="card pt-12 pb-8 px-6 mt-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
                  {t('home.step1Title')}
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                  {t('home.step1Desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-primary dark:bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  2
                </div>
              </div>
              <div className="card pt-12 pb-8 px-6 mt-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
                  {t('home.step2Title')}
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                  {t('home.step2Desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-primary dark:bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  3
                </div>
              </div>
              <div className="card pt-12 pb-8 px-6 mt-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
                  {t('home.step3Title')}
                </h3>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                  {t('home.step3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cities Section */}
        {cities.length > 0 && (
          <div className="mb-20 md:mb-28">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
                {t('home.cities')}
              </h2>
              <p className="text-lg md:text-xl text-text-secondary dark:text-text-secondary-dark">
                {t('home.citiesSubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {cities.map((city, index) => (
                <Link
                  key={index}
                  to={`/map?region=${encodeURIComponent(city.name)}`}
                  className="card overflow-hidden p-0 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img 
                      src={getCityImage(city.name)} 
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {city.name}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {city.count} {t('home.propertiesCount')}
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="inline-flex items-center text-primary dark:text-primary-light font-semibold group-hover:translate-x-2 transition-transform">
                      {t('home.exploreCity')}
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/cities"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 rounded-xl transition-all duration-200"
              >
                {t('home.viewAllCities')}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Map Preview Section */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              {t('home.interactiveMap')}
            </h2>
            <p className="text-lg md:text-xl text-text-secondary dark:text-text-secondary-dark">
              {t('home.mapSubtitle')}
            </p>
          </div>
          <div className="card overflow-hidden relative h-[500px] md:h-[600px]">
            <PropertyMap properties={properties} userLocation={userLocation} />
            <div className="absolute top-4 right-4 z-[1000]">
              <LocationButton onLocationFound={setUserLocation} />
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      {!user && (
        <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary-light to-primary-dark dark:from-primary/90 dark:via-primary/70 dark:to-primary/50">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {t('home.ctaTitle')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('home.ctaSubtitle')}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-white hover:bg-white/90 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('home.ctaButton')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
