import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function CTA() {
  const { t } = useTranslation();

  return (
    <section className="py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("landing.cta.title")}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("landing.cta.subtitle")}
        </p>
        <Link to="/signup">
          <Button size="lg" className="mt-8">
            {t("landing.cta.button")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
