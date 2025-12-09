import { Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/SplitText";
import ShinyText from "@/components/ShinyText";
import Beams from "@/components/Beams";
import { useTheme } from "@/components/ui/theme-provider";

export function LandingHeroV2() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {isDark ? (
        <div className="absolute inset-0">
          <Beams
            beamWidth={3}
            beamHeight={20}
            beamNumber={8}
            lightColor="#8b5cf6"
            speed={1.5}
            noiseIntensity={1.5}
            scale={0.2}
            rotation={-15}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-background to-background" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto max-w-6xl px-6 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <ShinyText
              text={t("landing.hero.badge")}
              className="mb-8 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
              speed={3}
            />

            <div className="mb-6">
              <SplitText
                text={t("landing.hero.title")}
                className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
                delay={50}
                duration={0.8}
                ease="power3.out"
                splitType="words"
                tag="h1"
              />
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="h-14 gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
                >
                  {t("landing.hero.cta")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 gap-2 rounded-full border-border bg-muted/50 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-muted"
                >
                  <Play className="h-4 w-4" />
                  {t("landing.hero.ctaSecondary")}
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                {t("landing.hero.noCreditCard")}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                {t("landing.hero.freeTrial")}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                {t("landing.hero.support")}
              </span>
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-50">
              <span className="text-xs uppercase tracking-widest text-muted-foreground/70">
                {t("landing.hero.trustedBy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
