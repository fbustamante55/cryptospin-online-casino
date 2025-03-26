import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import enTranslation from '../locales/en.json';
import esTranslation from '../locales/es.json';
import frTranslation from '../locales/fr.json';
import deTranslation from '../locales/de.json';
import itTranslation from '../locales/it.json';
import ptTranslation from '../locales/pt.json';
import ruTranslation from '../locales/ru.json';
import zhTranslation from '../locales/zh.json';
import jaTranslation from '../locales/ja.json';
import koTranslation from '../locales/ko.json';
import arTranslation from '../locales/ar.json';
import hiTranslation from '../locales/hi.json';
import trTranslation from '../locales/tr.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  es: {
    translation: esTranslation,
  },
  fr: {
    translation: frTranslation,
  },
  de: {
    translation: deTranslation,
  },
  it: {
    translation: itTranslation,
  },
  pt: {
    translation: ptTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
  ja: {
    translation: jaTranslation,
  },
  ko: {
    translation: koTranslation,
  },
  ar: {
    translation: arTranslation,
  },
  hi: {
    translation: hiTranslation,
  },
  tr: {
    translation: trTranslation,
  },
};

i18n
  // Detectar el idioma del navegador
  .use(LanguageDetector)
  // Pasar el objeto i18n a react-i18next
  .use(initReactI18next)
  // inicializar i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // no necesario para React
    },
    detection: {
      // Orden de detección de idioma
      order: ['localStorage', 'cookie', 'navigator'],
      // Clave para localStorage/cookie
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;