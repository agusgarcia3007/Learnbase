import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Aurora from "@/components/Aurora";
import GradientText from "@/components/GradientText";
import { useTheme } from "@/components/ui/theme-provider";

export function FinalCTA() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const auroraColors = isDark
    ? ["#8b5cf6", "#6366f1", "#3b82f6"]
    : ["#c4b5fd", "#a5b4fc", "#93c5fd"];

  return (
    <section className="relative overflow-hidden bg-muted/50 py-24 md:py-32">
      <div className="absolute inset-0 opacity-50">
        <Aurora
          colorStops={auroraColors}
          amplitude={0.8}
          speed={0.3}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <GradientText
          colors={["#a78bfa", "#8b5cf6", "#6366f1", "#a78bfa"]}
          animationSpeed={6}
          className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
        >
          {t("landing.finalCta.title")}
        </GradientText>

        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          {t("landing.finalCta.subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/signup">
            <Button
              size="lg"
              className="h-14 gap-2 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
            >
              {t("landing.finalCta.cta")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground/70">
          {t("landing.finalCta.guarantee")}
        </p>
      </div>
    </section>
  );
}
