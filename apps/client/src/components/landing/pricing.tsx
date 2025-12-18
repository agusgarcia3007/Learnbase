import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/pricing";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { ShimmerBorder } from "@/components/ui/shimmer-border";

export function Pricing() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("landing.pricing.subtitle")}
          </p>
        </FadeIn>

        <StaggerContainer staggerDelay={0.15} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => {
            const CardWrapper = plan.featured ? ShimmerBorder : "div";
            const wrapperProps = plan.featured
              ? { borderRadius: "1.5rem", borderWidth: 2 }
              : { className: "" };

            return (
              <StaggerItem key={plan.key}>
                <CardWrapper {...wrapperProps}>
                  <motion.div
                    className={`relative h-full rounded-3xl p-8 ${
                      plan.featured
                        ? "bg-card"
                        : "border border-border/50 bg-card/50 backdrop-blur-sm"
                    }`}
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {plan.featured && (
                      <motion.div
                        className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-violet-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg"
                        animate={{
                          boxShadow: [
                            "0 4px 20px hsl(var(--primary) / 0.3)",
                            "0 4px 30px hsl(var(--primary) / 0.5)",
                            "0 4px 20px hsl(var(--primary) / 0.3)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {t("landing.pricing.popular")}
                      </motion.div>
                    )}

                    <div className="mb-6">
                      <h3 className="mb-1 text-xl font-bold">
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
                      className={`mb-8 w-full ${
                        plan.featured
                          ? "bg-gradient-to-r from-primary to-violet-500 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                          : ""
                      }`}
                      variant={plan.featured ? "primary" : "secondary"}
                      size="lg"
                      asChild
                    >
                      <Link to="/signup">{t("landing.pricing.cta")}</Link>
                    </Button>

                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.div
                          key={feature}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: index * 0.1 + featureIndex * 0.05,
                          }}
                        >
                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {t(`landing.pricing.features.${feature}`)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </CardWrapper>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
