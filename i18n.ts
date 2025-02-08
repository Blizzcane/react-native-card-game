import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import bg from "@/locales/bg.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg }
  },
  lng: "en", // Default language
  fallbackLng: "en", // Fallback if translation is missing
  interpolation: { escapeValue: false }
});

export default i18n;
