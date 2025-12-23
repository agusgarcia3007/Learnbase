import { Link, useParams } from "@tanstack/react-router";
import { useTranslation, type Locale, locales } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  pt: "PT",
};

const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

export function Header() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { lang?: Locale };
  const currentLang = params.lang || "en";

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/$lang" params={{ lang: currentLang }} className="flex items-center gap-2.5">
          <img
            src="/logos/blue.png"
            alt="Learnbase"
            className="size-7 rounded-md"
          />
          <span className="text-lg font-semibold">{t("header.title")}</span>
        </Link>
        <nav className="flex items-center gap-4">
          <a
            href="https://uselearnbase.com"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("header.backToLearnbase")}
          </a>
          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
            {locales.map((locale) => (
              <Link
                key={locale}
                to="/$lang"
                params={{ lang: locale }}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  currentLang === locale
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={localeNames[locale]}
              >
                {localeLabels[locale]}
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
