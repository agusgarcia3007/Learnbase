import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    key: "starter",
    price: "$49",
    features: ["unlimited_students", "unlimited_courses", "ai_standard", "storage_15", "custom_domain", "fee_5"],
  },
  {
    key: "growth",
    price: "$99",
    featured: true,
    features: ["unlimited_students", "unlimited_courses", "ai_unlimited", "storage_100", "custom_domain", "fee_2"],
  },
  {
    key: "scale",
    price: "$349",
    features: ["unlimited_students", "unlimited_courses", "ai_unlimited", "storage_2tb", "custom_domain", "fee_0"],
  },
];

export function Pricing() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("landing.pricing.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-8",
                tier.featured && "border-primary shadow-lg"
              )}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    {t("landing.pricing.popular")}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold">
                  {t(`landing.pricing.tiers.${tier.key}.name`)}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">
                    /{t("landing.pricing.month")}
                  </span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t(`landing.pricing.features.${feature}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button
                  className="w-full"
                  variant={tier.featured ? "default" : "outline"}
                >
                  {t("landing.pricing.cta")}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
