import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-bg)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <LearnbaseLogo className="h-7 w-7" />
            <span className="text-base font-semibold text-[var(--landing-text)]">
              {siteData.name}
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              to="/features"
              className="text-sm text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]"
            >
              {t("landing.footer.roadmap")}
            </Link>
            <Link
              to="/terms"
              className="text-sm text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]"
            >
              {t("landing.footer.terms")}
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]"
            >
              {t("landing.footer.privacy")}
            </Link>
          </div>

          <p className="text-sm text-[var(--landing-text-muted)]">
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
