import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Currency exchange rates (base: USD)
const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.92,
  MAD: 10.0, // Moroccan Dirham
  AED: 3.67, // UAE Dirham
  SAR: 3.75  // Saudi Riyal
};

// Language to currency mapping
const LANGUAGE_CURRENCY = {
  en: 'USD',
  fr: 'EUR',
  ar: 'MAD'
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('currency');
    const savedLanguage = localStorage.getItem('i18nextLng') || 'fr';
    return savedCurrency || LANGUAGE_CURRENCY[savedLanguage] || 'EUR';
  });

  useEffect(() => {
    const currentLang = i18n.language || 'fr';
    const langCode = currentLang.split('-')[0];
    if (!localStorage.getItem('currency')) {
      const defaultCurrency = LANGUAGE_CURRENCY[langCode] || 'EUR';
      setCurrency(defaultCurrency);
      localStorage.setItem('currency', defaultCurrency);
    }
  }, [i18n.language]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    const langCode = lng.split('-')[0];
    const newCurrency = LANGUAGE_CURRENCY[langCode] || 'USD';
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatPrice = (price, fromCurrency = 'MAD') => {
    if (!price) return '0';
    
    // Convert to target currency (prices in DB are in MAD)
    const basePrice = price / CURRENCY_RATES[fromCurrency];
    const convertedPrice = basePrice * CURRENCY_RATES[currency];
    
    // Get symbol based on current language
    const langCode = (i18n.language || 'fr').split('-')[0];
    const currencySymbols = {
      ar: { // Arabic symbols
        USD: '$',
        EUR: '€',
        MAD: 'د.م',
        AED: 'د.إ',
        SAR: 'ر.س'
      },
      fr: { // French symbols
        USD: '$',
        EUR: '€',
        MAD: 'DH',
        AED: 'AED',
        SAR: 'SAR'
      },
      en: { // English symbols
        USD: '$',
        EUR: '€',
        MAD: 'DH',
        AED: 'AED',
        SAR: 'SAR'
      }
    };

    const symbolMap = currencySymbols[langCode] || currencySymbols.fr;
    const symbol = symbolMap[currency] || currency;
    const formatted = convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    // For RTL languages (Arabic), put symbol after
    if (langCode === 'ar') {
      return `${formatted} ${symbol}`;
    }
    return `${symbol}${formatted}`;
  };

  const getCurrencySymbol = () => {
    // Get symbol based on current language
    const langCode = (i18n.language || 'fr').split('-')[0];
    const currencySymbols = {
      ar: { // Arabic symbols
        USD: '$',
        EUR: '€',
        MAD: 'د.م',
        AED: 'د.إ',
        SAR: 'ر.س'
      },
      fr: { // French symbols
        USD: '$',
        EUR: '€',
        MAD: 'DH',
        AED: 'AED',
        SAR: 'SAR'
      },
      en: { // English symbols
        USD: '$',
        EUR: '€',
        MAD: 'DH',
        AED: 'AED',
        SAR: 'SAR'
      }
    };

    const symbolMap = currencySymbols[langCode] || currencySymbols.fr;
    return symbolMap[currency] || currency;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage: i18n.language,
        currency,
        changeLanguage,
        changeCurrency,
        formatPrice,
        getCurrencySymbol,
        isRTL: i18n.language === 'ar'
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

