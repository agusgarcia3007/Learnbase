import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";

type Locale = "en" | "es" | "pt";

type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, es, pt };

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof result === "string" ? result : path;
}

type I18nProviderProps = {
  children: ReactNode;
  defaultLocale?: Locale;
};

export function I18nProvider({ children, defaultLocale = "en" }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem("blog-locale", newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = getNestedValue(
        translations[locale] as unknown as Record<string, unknown>,
        key
      );

      if (params) {
        for (const [param, value] of Object.entries(params)) {
          text = text.replace(`{${param}}`, String(value));
        }
      }

      return text;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

export const locales: Locale[] = ["en", "es", "pt"];
export type { Locale };
