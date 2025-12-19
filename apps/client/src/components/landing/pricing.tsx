import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";
import { PLANS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Pricing() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="bg-[var(--landing-bg-alt)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--landing-text)] sm:text-4xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--landing-text-muted)]">
            {t("landing.pricing.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.key}
              className={cn(
                "relative rounded-2xl border p-8",
                plan.featured
                  ? "border-[var(--landing-accent)] bg-[var(--landing-card)]"
                  : "border-[var(--landing-border)] bg-[var(--landing-card)]"
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--landing-accent)] px-4 py-1 text-xs font-semibold text-white">
                  {t("landing.pricing.popular")}
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold text-[var(--landing-text)]">
                  {t(`landing.pricing.tiers.${plan.key}.name`)}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--landing-text)]">
                    {plan.price}
                  </span>
                  <span className="text-[var(--landing-text-muted)]">
                    /{t("landing.pricing.month")}
                  </span>
                </div>
              </div>

              <Button
                className={cn(
                  "mb-8 w-full",
                  plan.featured && "bg-[var(--landing-accent)] hover:bg-[var(--landing-accent)]/90"
                )}
                variant={plan.featured ? "primary" : "outline"}
                size="lg"
                asChild
              >
                <Link to="/signup">{t("landing.pricing.cta")}</Link>
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--landing-accent-light)]">
                      <Check className="h-3 w-3 text-[var(--landing-accent)]" />
                    </div>
                    <span className="text-sm text-[var(--landing-text-muted)]">
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
