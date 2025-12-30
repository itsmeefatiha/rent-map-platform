import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PropertyCard } from '../components/PropertyCard';
import { recommendationsApi } from '../api/recommendations';
import { useAuth } from '../context/AuthContext';
import { 
  TargetIcon, 
  UsersIcon, 
  ContentIcon, 
  CheckIcon, 
  FireIcon, 
  LightBulbIcon,
  StarIcon,
  RefreshIcon
} from '../components/Icons';

export const Recommendations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (user && user.role === 'TENANT') {
      const token = localStorage.getItem('token');
      if (token) {
        loadRecommendations();
      } else {
        setError(t('recommendations.mustBeLoggedIn'));
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRecommendations = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('recommendations.mustBeLoggedIn'));
        setLoading(false);
        return;
      }
      
      const data = await recommendationsApi.getRecommendations(20);
      setRecommendations(data || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      if (error.message) {
        setError(error.message);
      } else if (error.response?.status === 403) {
        setError(t('recommendations.accessDenied'));
      } else {
        setError(t('recommendations.errorLoading'));
      }
    } finally {
      setLoading(false);
    }
  };

  const translateReason = (reason, type) => {
    if (!reason) return '';
    
    // Utiliser le type de recommandation pour une traduction plus précise (priorité)
    if (type) {
      switch (type.toUpperCase()) {
        case 'COLLABORATIVE':
          return t('recommendations.collaborativeFilteringDesc');
        case 'CONTENT_BASED':
          return t('recommendations.contentBasedFilteringDesc');
        case 'PREFERENCE_BASED':
          return t('recommendations.explicitPreferencesDesc');
        case 'POPULAR':
          return t('recommendations.popularPropertiesDesc');
        default:
          break;
      }
    }
    
    // Fallback: Traduire les raisons basées sur le contenu du texte
    // Gérer les raisons multiples séparées par " | "
    const reasons = reason.split(' | ');
    const translatedReasons = reasons.map(r => {
      r = r.trim();
      const lowerR = r.toLowerCase();
      
      // Détecter les différentes variantes de texte français/anglais
      if (lowerR.includes('utilisateurs similaires') || 
          lowerR.includes('similar users') || 
          lowerR.includes('recommandé par') ||
          lowerR.includes('utilisateurs ayant') ||
          lowerR.includes('goûts similaires')) {
        return t('recommendations.collaborativeFilteringDesc');
      }
      if (lowerR.includes('similaire') || 
          lowerR.includes('similar') ||
          lowerR.includes('aimées') ||
          lowerR.includes('favoris') ||
          lowerR.includes('liked')) {
        return t('recommendations.contentBasedFilteringDesc');
      }
      if (lowerR.includes('préférences') || 
          lowerR.includes('preferences') || 
          lowerR.includes('correspond') ||
          lowerR.includes('matches')) {
        return t('recommendations.explicitPreferencesDesc');
      }
      if (lowerR.includes('populaire') || 
          lowerR.includes('popular') ||
          lowerR.includes('propriété populaire')) {
        return t('recommendations.popularPropertiesDesc');
      }
      return r; // Retourner la raison originale si aucune correspondance
    });
    
    return translatedReasons.join(' | ');
  };

  const getRecommendationBadge = (type) => {
    const badges = {
      COLLABORATIVE: {
        label: t('recommendations.similarUsers'),
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        Icon: UsersIcon,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-700 dark:text-blue-300',
      },
      CONTENT_BASED: {
        label: t('recommendations.similarToFavorites'),
        color: 'bg-gradient-to-r from-purple-500 to-purple-600',
        Icon: ContentIcon,
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-700 dark:text-purple-300',
      },
      PREFERENCE_BASED: {
        label: t('recommendations.matchesPreferences'),
        color: 'bg-gradient-to-r from-green-500 to-green-600',
        Icon: CheckIcon,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-700 dark:text-green-300',
      },
      POPULAR: {
        label: t('recommendations.popular'),
        color: 'bg-gradient-to-r from-orange-500 to-orange-600',
        Icon: FireIcon,
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-700 dark:text-orange-300',
      },
    };
    return badges[type] || badges.POPULAR;
  };

  const filteredRecommendations = useMemo(() => {
    return filterType === 'ALL' 
      ? recommendations 
      : recommendations.filter(rec => rec.recommendationType === filterType);
  }, [recommendations, filterType]);

  const stats = useMemo(() => {
    if (recommendations.length === 0) {
      return {
        total: 0,
        collaborative: 0,
        contentBased: 0,
        preferenceBased: 0,
        popular: 0,
        averageScore: 0,
      };
    }

    return {
      total: recommendations.length,
      collaborative: recommendations.filter(r => r.recommendationType === 'COLLABORATIVE').length,
      contentBased: recommendations.filter(r => r.recommendationType === 'CONTENT_BASED').length,
      preferenceBased: recommendations.filter(r => r.recommendationType === 'PREFERENCE_BASED').length,
      popular: recommendations.filter(r => r.recommendationType === 'POPULAR').length,
      averageScore: Math.round(
        recommendations.reduce((sum, r) => sum + r.recommendationScore, 0) / recommendations.length * 100
      ),
    };
  }, [recommendations]);

  if (!user || user.role !== 'TENANT') {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="card p-8 shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              {t('recommendations.accessReserved')}
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
              {t('recommendations.accessReservedMessage')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('recommendations.login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-text-secondary dark:text-text-secondary-dark text-lg font-medium mt-4">
            {t('recommendations.analyzingPreferences')}
          </div>
          <p className="text-text-secondary dark:text-text-secondary-dark text-sm mt-2">
            {t('recommendations.aiPreparing')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center transition-colors duration-300">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">{t('recommendations.error')}</h3>
            <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
            <button
              onClick={loadRecommendations}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('recommendations.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      {/* Hero Header avec gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary-dark dark:from-primary/90 dark:via-primary/70 dark:to-primary/50">
        <div className="absolute inset-0 bg-black/5"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TargetIcon className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg">
                  {t('recommendations.title')}
                </h1>
              </div>
              <p className="text-lg md:text-xl text-white/95 max-w-2xl leading-relaxed">
                {t('recommendations.subtitle')}
              </p>
            </div>
            <button
              onClick={loadRecommendations}
              className="px-6 py-3 bg-white hover:bg-white/90 text-primary rounded-xl font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2"
            >
              <RefreshIcon className="w-5 h-5" />
              {t('recommendations.refresh')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Statistiques */}
        {recommendations.length > 0 && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t('recommendations.total')}</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.averageScore}%</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">{t('recommendations.averageScore')}</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.contentBased}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">{t('recommendations.contentBased')}</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.collaborative}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">{t('recommendations.collaborative')}</div>
            </div>
          </div>
        )}

        {/* Filtres */}
        {recommendations.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                filterType === 'ALL'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark hover:bg-primary/10 dark:hover:bg-primary/20'
              }`}
            >
              {t('recommendations.all')} ({stats.total})
            </button>
            <button
              onClick={() => setFilterType('COLLABORATIVE')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                filterType === 'COLLABORATIVE'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              {t('recommendations.collaboratives')} ({stats.collaborative})
            </button>
            <button
              onClick={() => setFilterType('CONTENT_BASED')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                filterType === 'CONTENT_BASED'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              <ContentIcon className="w-4 h-4" />
              {t('recommendations.contentBasedFilter')} ({stats.contentBased})
            </button>
            <button
              onClick={() => setFilterType('PREFERENCE_BASED')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                filterType === 'PREFERENCE_BASED'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <CheckIcon className="w-4 h-4" />
              {t('recommendations.preferences')} ({stats.preferenceBased})
            </button>
            <button
              onClick={() => setFilterType('POPULAR')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                filterType === 'POPULAR'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
            >
              <FireIcon className="w-4 h-4" />
              {t('recommendations.popular')} ({stats.popular})
            </button>
          </div>
        )}

        {/* Recommendations Grid */}
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-16">
            <div className="card p-12 max-w-lg mx-auto shadow-xl">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
                {recommendations.length === 0 ? t('recommendations.noRecommendations') : t('recommendations.noResultsForFilter')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark mb-8">
                {recommendations.length === 0 
                  ? t('recommendations.noRecommendationsMessage')
                  : t('recommendations.tryAnotherFilter')}
              </p>
              <Link
                to="/map"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('recommendations.exploreProperties')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredRecommendations.map((rec, index) => {
              const badge = getRecommendationBadge(rec.recommendationType);
              return (
                <div 
                  key={rec.property.id} 
                  className="relative group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Badge de recommandation amélioré */}
                  <div className={`absolute top-4 left-4 z-10 flex items-center gap-2 ${badge.color} backdrop-blur-sm px-3 py-1.5 rounded-full shadow-xl transform group-hover:scale-105 transition-transform duration-200`}>
                    <badge.Icon className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white">
                      {badge.label}
                    </span>
                  </div>
                  
                  {/* Score de recommandation avec gradient */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-primary to-primary-dark backdrop-blur-sm px-4 py-2 rounded-full shadow-xl transform group-hover:scale-105 transition-transform duration-200">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-white" filled />
                        <span className="text-xs font-bold text-white">
                          {Math.round(rec.recommendationScore * 100)}{t('recommendations.percentMatch')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Carte de propriété */}
                  <div className="transform transition-all duration-300 hover:scale-[1.02]">
                    <PropertyCard property={rec.property} />
                  </div>
                  
                  {/* Raison de la recommandation avec style amélioré */}
                  <div className={`mt-3 p-3 rounded-lg ${badge.bgColor} border border-current/10`}>
                    <p className={`text-sm ${badge.textColor} font-medium flex items-center gap-2`}>
                      <badge.Icon className="w-5 h-5" />
                      {translateReason(rec.reason, rec.recommendationType)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section améliorée */}
        <div className="mt-16 card p-8 md:p-10 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border border-primary/20 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <LightBulbIcon className="w-7 h-7 text-primary dark:text-primary-light" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                {t('recommendations.howItWorks')}
              </h3>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                {t('recommendations.howItWorksSubtitle')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/50 dark:bg-surface-dark/50 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <strong className="text-text-primary dark:text-text-primary-dark">{t('recommendations.collaborativeFiltering')}</strong>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2">
                {t('recommendations.collaborativeFilteringDesc')}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-surface-dark/50 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <ContentIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <strong className="text-text-primary dark:text-text-primary-dark">{t('recommendations.contentBasedFiltering')}</strong>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2">
                {t('recommendations.contentBasedFilteringDesc')}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-surface-dark/50 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <strong className="text-text-primary dark:text-text-primary-dark">{t('recommendations.explicitPreferences')}</strong>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2">
                {t('recommendations.explicitPreferencesDesc')}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-surface-dark/50 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <FireIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <strong className="text-text-primary dark:text-text-primary-dark">{t('recommendations.popularProperties')}</strong>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-2">
                {t('recommendations.popularPropertiesDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};
