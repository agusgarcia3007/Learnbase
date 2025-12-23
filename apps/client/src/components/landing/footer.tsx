import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

const footerLinks = [
  { key: "roadmap", to: "/features" },
  { key: "changelog", to: "/changelog" },
  { key: "blog", href: "https://blog.uselearnbase.com" },
  { key: "terms", to: "/terms" },
  { key: "privacy", to: "/privacy" },
];

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden">
        <span
          className="translate-y-[35%] select-none text-[20vw] font-bold leading-none tracking-tighter text-foreground/[0.03] dark:text-foreground/[0.04]"
          aria-hidden="true"
        >
          {siteData.name}
        </span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
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
            {footerLinks.map((link) =>
              "href" in link ? (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(`landing.footer.${link.key}`)}
                </a>
              ) : (
                <Link
                  key={link.key}
                  to={link.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(`landing.footer.${link.key}`)}
                </Link>
              )
            )}
          </nav>

          <p className="text-sm text-muted-foreground">
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
