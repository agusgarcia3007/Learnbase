import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ColorBends } from "@/components/ui/color-bends";

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <ColorBends
          colors={["#6366f1", "#8b5cf6", "#d946ef", "#ec4899"]}
          speed={0.15}
          scale={1.2}
          frequency={0.8}
          warpStrength={0.8}
          mouseInfluence={0.3}
          parallax={0.3}
          noise={0.05}
          transparent={false}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto max-w-6xl px-6 py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              {t("landing.hero.badge")}
            </span>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {t("landing.hero.title")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-white px-8 text-sm font-semibold text-zinc-900 hover:bg-white/90"
                >
                  {t("landing.hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                >
                  {t("landing.hero.ctaSecondary")}
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("landing.hero.noCreditCard")}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("landing.hero.freeTrial")}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("landing.hero.support")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
