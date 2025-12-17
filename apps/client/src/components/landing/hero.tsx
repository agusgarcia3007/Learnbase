import { Link, ClientOnly } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LightRays = lazy(() => import("@/components/LightRays"));

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <ClientOnly>
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <LightRays
              raysOrigin="top-center"
              raysColor="#8b5cf6"
              raysSpeed={0.8}
              lightSpread={1.2}
              rayLength={1.5}
              fadeDistance={0.8}
              mouseInfluence={0.05}
            />
          </Suspense>
        </div>
      </ClientOnly>

      <div className="relative mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="text-center">
          <Badge variant="secondary" className="mb-5">
            {t("landing.hero.badge")}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.hero.title")}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
