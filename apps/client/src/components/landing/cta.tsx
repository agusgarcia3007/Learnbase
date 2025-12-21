import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  const { t } = useTranslation();

  return (
    <section className="relative isolate overflow-hidden bg-background py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/images/night-landscape.webp"
          alt=""
          className="hidden h-full w-full object-cover opacity-60 dark:block"
        />
        <img
          src="/images/day-landscape.webp"
          alt=""
          className="h-full w-full object-cover opacity-70 dark:hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {t("landing.cta.title")}
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("landing.cta.subtitle")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-full px-8 text-base font-medium"
              asChild
            >
              <Link to="/signup">
                {t("landing.cta.button")}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
