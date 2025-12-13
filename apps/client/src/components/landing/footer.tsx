import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <LearnbaseLogo className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              {siteData.name}
            </span>
          </Link>

          <p className="text-sm text-muted-foreground">
            {t("landing.footer.description")}
          </p>

          <p className="text-xs text-muted-foreground">
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
