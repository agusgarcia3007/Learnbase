import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Pricing() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="relative overflow-hidden bg-muted/30 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            {t("landing.pricing.eyebrow", { defaultValue: "Pricing" })}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
            {t("landing.pricing.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.key}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl border bg-background p-8",
                plan.featured
                  ? "border-primary shadow-xl shadow-primary/10"
                  : "border-border/50"
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {plan.featured && (
                <>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                      <Sparkles className="size-3" />
                      {t("landing.pricing.popular")}
                    </div>
                  </div>
                </>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold">
                  {t(`landing.pricing.tiers.${plan.key}.name`)}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{t("landing.pricing.month")}
                  </span>
                </div>
              </div>

              <Button
                className={cn(
                  "mb-8 w-full",
                  plan.featured
                    ? ""
                    : "border-border/50"
                )}
                variant={plan.featured ? "default" : "outline"}
                size="lg"
                asChild
              >
                <Link to="/signup">{t("landing.pricing.cta")}</Link>
              </Button>

              <div className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={cn(
                      "flex size-5 flex-shrink-0 items-center justify-center rounded-full",
                      plan.featured ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Check className={cn(
                        "size-3",
                        plan.featured ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t(`landing.pricing.features.${feature}`)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
