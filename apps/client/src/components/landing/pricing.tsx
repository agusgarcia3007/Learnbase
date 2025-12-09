import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/SplitText";
import GradientText from "@/components/GradientText";

const features = [
  "unlimited_courses",
  "unlimited_students",
  "ai_suite",
  "custom_domain",
  "white_label",
  "analytics",
  "support",
  "updates",
];

export function Pricing() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="relative overflow-hidden bg-muted/30 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-4xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SplitText
            text={t("landing.pricing.title")}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
            delay={30}
            duration={0.6}
            splitType="words"
            tag="h2"
          />
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-muted/50 to-transparent p-1">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

            <div className="rounded-[calc(1.5rem-4px)] bg-card/80 p-8 backdrop-blur-xl md:p-12">
              <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    {t("landing.pricing.badge")}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {t("landing.pricing.plan_name")}
                  </h3>
                </div>

                <div className="text-center md:text-right">
                  <div className="flex items-baseline justify-center gap-1 md:justify-end">
                    <GradientText
                      colors={["#a78bfa", "#8b5cf6", "#7c3aed"]}
                      animationSpeed={4}
                      className="text-5xl font-bold md:text-6xl"
                    >
                      $220
                    </GradientText>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    + 2% {t("landing.pricing.transaction_fee")}
                  </p>
                </div>
              </div>

              <div className="my-8 h-px bg-border" />

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground/80">
                      {t(`landing.pricing.features.${feature}`)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center gap-4">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-14 w-full rounded-full bg-primary px-12 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 sm:w-auto"
                  >
                    {t("landing.pricing.cta")}
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  {t("landing.pricing.guarantee")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
