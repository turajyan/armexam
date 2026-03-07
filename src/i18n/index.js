import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import hy from './locales/hy.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  hy: { translation: hy },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'hy'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'armexam_general_settings',
      convertDetectedLanguage: (lng) => {
        try {
          const settings = JSON.parse(localStorage.getItem('armexam_general_settings') || '{}');
          return settings.language || lng;
        } catch {
          return lng;
        }
      },
    },
  });

window.addEventListener('armexam:langchange', () => {
  try {
    const settings = JSON.parse(localStorage.getItem('armexam_general_settings') || '{}');
    if (settings.language) i18n.changeLanguage(settings.language);
  } catch {}
});

export default i18n;
