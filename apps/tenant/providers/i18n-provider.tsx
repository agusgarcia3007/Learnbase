"use client";

import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { useEffect, useState } from "react";

import en from "@/locales/en.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
};

let i18nInitialized = false;

function initI18n() {
  if (i18nInitialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "es",
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });

  i18nInitialized = true;
  return i18n;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [instance] = useState(() => initI18n());

  useEffect(() => {
    initI18n();
  }, []);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

export { i18n };
