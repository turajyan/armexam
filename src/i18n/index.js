import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import hy from './locales/hy.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  hy: { translation: hy },
};

// Read saved language from settings, default to 'en'
function getSavedLang() {
  try {
    const s = JSON.parse(localStorage.getItem('armexam_general_settings') || '{}');
    return s.language || 'en';
  } catch {
    return 'en';
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng:         getSavedLang(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'hy'],
    interpolation: {
      escapeValue: false,
    },
  });

window.addEventListener('armexam:langchange', () => {
  try {
    const settings = JSON.parse(localStorage.getItem('armexam_general_settings') || '{}');
    if (settings.language) i18n.changeLanguage(settings.language);
  } catch {}
});

export default i18n;
