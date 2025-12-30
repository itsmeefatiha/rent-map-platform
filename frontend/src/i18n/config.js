import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar }
    },
    fallbackLng: 'fr',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const langCode = lng.split('-')[0];
  document.documentElement.lang = langCode;
  document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
});

// Set initial direction
const initialLang = i18n.language || localStorage.getItem('i18nextLng') || 'fr';
const initialLangCode = initialLang.split('-')[0];
document.documentElement.lang = initialLangCode;
document.documentElement.dir = initialLangCode === 'ar' ? 'rtl' : 'ltr';

export default i18n;

