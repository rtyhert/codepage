import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

const saved = typeof window !== 'undefined' ? localStorage.getItem('codepage:lang') : null;

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: saved || 'zh',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(lng: string) {
  i18n.changeLanguage(lng);
  localStorage.setItem('codepage:lang', lng);
}

export default i18n;
