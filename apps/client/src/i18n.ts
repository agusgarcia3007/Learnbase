import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";

const isServer = typeof window === "undefined";

const instance = i18n.use(initReactI18next);

if (!isServer) {
  instance.use(LanguageDetector);
}

instance.init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
  },
  lng: isServer ? "es" : undefined,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
