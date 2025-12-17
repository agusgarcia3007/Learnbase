import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl items-center px-6 py-24">
        <div className="w-full text-center">
          <Badge variant="secondary" className="mb-6">
            {t("landing.hero.badge")}
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t("landing.hero.title")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                {t("landing.hero.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline">
                {t("landing.hero.ctaSecondary")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
