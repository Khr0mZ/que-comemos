import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
    },
    supportedLngs: ['en', 'es'],
    fallbackLng: 'es',
    detection: {
      // Orden de detección: localStorage -> navigator -> htmlTag -> fallback
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache del idioma en localStorage
      caches: ['localStorage'],
      // Buscar solo en el idioma base (en, es) sin variantes regionales
      lookupLocalStorage: 'i18nextLng',
      // Verificar que el idioma guardado sea válido
      checkWhitelist: true,
    },
    // Convertir automáticamente variantes de idioma a idiomas base soportados
    // 'en-US', 'en-GB' -> 'en', 'es-ES', 'es-MX' -> 'es'
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

