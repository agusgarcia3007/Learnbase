import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";

export function CTA() {
  const { t } = useTranslation();

  return (
    <section className="bg-[var(--landing-accent-light)] py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--landing-text)] sm:text-4xl md:text-5xl">
            {t("landing.cta.title")}
          </h2>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[var(--landing-text-muted)]">
            {t("landing.cta.subtitle")}
          </p>

          <Button
            size="lg"
            className="h-12 rounded-full bg-[var(--landing-accent)] px-10 text-base font-medium hover:bg-[var(--landing-accent)]/90"
            asChild
          >
            <Link to="/signup">{t("landing.cta.button")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
