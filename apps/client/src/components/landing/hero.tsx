import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";
import { Check, Sparkles } from "lucide-react";

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-[var(--landing-bg)] py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--landing-accent-light)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--landing-accent-light)_0%,transparent_40%)]" />

      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)] px-4 py-2 text-sm text-[var(--landing-text-muted)]">
            <Sparkles className="h-4 w-4 text-[var(--landing-accent)]" />
            <span>{t("landing.hero.badge")}</span>
          </div>

          <h1 className="mb-6 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-[var(--landing-text)] sm:text-5xl md:text-6xl lg:text-7xl">
            {t("landing.hero.title")}
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-[var(--landing-text-muted)] md:text-xl">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-full px-8 text-base font-medium shadow-sm transition-shadow hover:shadow-md"
              asChild
            >
              <Link to="/signup">{t("landing.hero.cta")}</Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-[var(--landing-border)] bg-transparent px-8 text-base font-medium text-[var(--landing-text)] hover:bg-[var(--landing-accent-light)]"
              asChild
            >
              <a href="#pricing">{t("landing.hero.ctaSecondary")}</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--landing-text-muted)]">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--landing-accent-light)]">
                <Check className="h-3 w-3 text-[var(--landing-accent)]" />
              </div>
              <span>{t("landing.hero.trust1", { defaultValue: "7-day free trial" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--landing-accent-light)]">
                <Check className="h-3 w-3 text-[var(--landing-accent)]" />
              </div>
              <span>{t("landing.hero.trust2", { defaultValue: "Setup in 5 minutes" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--landing-accent-light)]">
                <Check className="h-3 w-3 text-[var(--landing-accent)]" />
              </div>
              <span>{t("landing.hero.trust3", { defaultValue: "No credit card required" })}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-16 md:mt-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)] shadow-2xl shadow-black/10">
              <div className="flex items-center gap-2 border-b border-[var(--landing-border)] bg-[var(--landing-bg-alt)] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="mx-auto h-5 w-64 rounded-md bg-[var(--landing-border)]" />
                </div>
              </div>
              <div className="aspect-video bg-[var(--landing-bg-alt)]">
                <img
                  src="/images/hero-screenshot.png"
                  alt="LearnBase Dashboard"
                  className="h-full w-full object-contain"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
