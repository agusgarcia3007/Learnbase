import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

const footerLinks = [
  { key: "roadmap", to: "/features" },
  { key: "changelog", to: "/changelog" },
  { key: "terms", to: "/terms" },
  { key: "privacy", to: "/privacy" },
];

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-8">
          <Link
            to="/"
            search={{ campus: undefined }}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <LearnbaseLogo className="size-8" />
            <span className="text-lg font-semibold">
              {siteData.name}
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.key}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(`landing.footer.${link.key}`)}
              </Link>
            ))}
          </nav>

          <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-border to-transparent" />

          <p className="text-sm text-muted-foreground">
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
