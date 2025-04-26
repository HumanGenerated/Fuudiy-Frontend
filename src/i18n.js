// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './translations/en/global.json';
import translationTR from './translations/tr/global.json';

i18n
  // this plugin will look in localStorage (and navigator, htmlTag, etc)
  .use(LanguageDetector)                                 
  .use(initReactI18next)
  .init({
    resources: {
      en: { global: translationEN },
      tr: { global: translationTR },
    },
    ns: ['global'],
    defaultNS: 'global',                                                
    fallbackLng: 'en',
    detection: { 
      order: ['localStorage','navigator'],
      lookupLocalStorage: 'language',   // key in localStorage
      caches: ['localStorage'],         // cache selection back to LS
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
