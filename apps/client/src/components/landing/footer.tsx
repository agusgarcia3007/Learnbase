import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <Link to="/" className="group flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <LearnbaseLogo className="h-8 w-8" />
            </motion.div>
            <span className="text-base font-semibold tracking-tight">
              {siteData.name}
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              to="/terms"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.footer.terms")}
              <span className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <Link
              to="/privacy"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.footer.privacy")}
              <span className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
