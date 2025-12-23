import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logos/blue.png"
            alt="Learnbase"
            className="size-7 rounded-md"
          />
          <span className="text-lg font-semibold">{t("header.title")}</span>
        </Link>
        <nav className="flex items-center gap-6">
          <a
            href="https://learnbase.com"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("header.backToLearnbase")}
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
