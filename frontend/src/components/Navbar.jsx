import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { ChatDropdown } from './ChatDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';
import mapImage from '../assets/images/map.png';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { changeLanguage, currentLanguage, currency, changeCurrency } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const languageMenuRef = useRef(null);
  const currencyMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target)) {
        setShowCurrencyMenu(false);
      }
    };

    if (showLanguageMenu || showCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu, showCurrencyMenu]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-primary dark:bg-bg-dark shadow-lg border-b border-border dark:border-border-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 group">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg transition-all">
                <img src={mapImage} alt="Map" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">RentMap</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                {t('common.home')}
              </Link>
              {user && (
                <>
                  <Link to="/map" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                    {t('common.exploreMap')}
                  </Link>
                  {user.role === 'OWNER' && (
                    <>
                      <Link to="/publish" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                        {t('common.publish')}
                      </Link>
                      <Link to="/my-properties" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                        {t('common.myProperties')}
                      </Link>
                    </>
                  )}
                  {user.role === 'TENANT' && (
                    <>
                      <Link to="/recommendations" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                        {t('common.recommendations') || 'Recommandations'}
                      </Link>
                      <Link to="/favorites" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                        {t('common.favorites')}
                      </Link>
                      <Link to="/chatbot" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center space-x-1">
                        
                        <span>{t('chat.virtualAssistant')}</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <div className="relative" ref={currencyMenuRef}>
              <button
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm flex items-center space-x-1"
                aria-label="Change currency"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold hidden sm:inline">
                  {t(`currencySymbol.${currency.toLowerCase()}`)}
                </span>
              </button>
              {showCurrencyMenu && (
                <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 bg-surface dark:bg-surface-dark rounded-lg shadow-xl border border-border dark:border-border-dark z-50">
                  {['MAD', 'USD', 'EUR', 'AED', 'SAR'].map((currencyCode) => (
                    <button
                      key={currencyCode}
                      onClick={() => {
                        changeCurrency(currencyCode);
                        setShowCurrencyMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center space-x-2 ${
                        currency === currencyCode ? 'bg-primary/10 dark:bg-primary/20' : ''
                      }`}
                    >
                      <span className="text-text-primary dark:text-text-primary-dark">
                        {t(`currency.${currencyCode.toLowerCase()}`)}
                      </span>
                      {currency === currencyCode && (
                        <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm flex items-center space-x-1"
                aria-label="Change language"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="text-sm font-semibold hidden sm:inline">
                  {currentLanguage === 'fr' ? '🇫🇷' : currentLanguage === 'ar' ? '🇲🇦' : '🇬🇧'}
                </span>
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 bg-surface dark:bg-surface-dark rounded-lg shadow-xl border border-border dark:border-border-dark z-50">
                  <button
                    onClick={() => {
                      changeLanguage('fr');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center space-x-2 ${
                      currentLanguage === 'fr' ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                  >
                    <span>🇫🇷</span>
                    <span className="text-text-primary dark:text-text-primary-dark">{t('language.french')}</span>
                    {currentLanguage === 'fr' && (
                      <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center space-x-2 ${
                      currentLanguage === 'en' ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span className="text-text-primary dark:text-text-primary-dark">{t('language.english')}</span>
                    {currentLanguage === 'en' && (
                      <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('ar');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center space-x-2 ${
                      currentLanguage === 'ar' ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                  >
                    <span>🇲🇦</span>
                    <span className="text-text-primary dark:text-text-primary-dark">{t('language.arabic')}</span>
                    {currentLanguage === 'ar' && (
                      <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            {user && (
              <>
                <ChatDropdown />
                {user.role === 'TENANT' && <NotificationsDropdown />}
              </>
            )}
            {user ? (
              <>
                <Link to="/profile" className="relative group">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-all cursor-pointer ring-2 ring-white/20 hover:ring-white/40 group-hover:scale-110">
                    {user.profilePicture ? (
                      <img 
                        src={`http://localhost:8080${user.profilePicture}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.firstName || '') + ' ' + (user.lastName || ''))}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-white rounded-full"></div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm"
                  aria-label={t('common.logout')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-white text-primary hover:bg-white/90 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
