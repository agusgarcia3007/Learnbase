import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Aurora } from "@/components/ui/aurora";
import { SplitText } from "@/components/ui/split-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { FadeIn } from "@/components/ui/fade-in";

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      <Aurora
        colors={["#3b82f6", "#8b5cf6", "#06b6d4", "#6366f1"]}
        speed={0.8}
        blur={120}
        opacity={0.35}
      />

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-[1200px] flex-col items-center justify-center px-6 py-24">
        <FadeIn delay={0.1} className="mb-8">
          <motion.div
            className="group relative inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5 backdrop-blur-sm"
            whileHover={{ scale: 1.02 }}
            animate={{
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.1)",
                "0 0 40px hsl(var(--primary) / 0.2)",
                "0 0 20px hsl(var(--primary) / 0.1)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-medium tracking-wide text-primary">
              {t("landing.hero.badge")}
            </span>
          </motion.div>
        </FadeIn>

        <div className="mb-8 max-w-[900px] text-center">
          <h1 className="text-balance text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <SplitText delay={0.3} staggerDelay={0.02}>
              {t("landing.hero.title")}
            </SplitText>
          </h1>
        </div>

        <FadeIn delay={0.8} blur className="mb-12 max-w-[600px] text-center">
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("landing.hero.subtitle")}
          </p>
        </FadeIn>

        <FadeIn delay={1} className="flex flex-col items-center gap-4 sm:flex-row">
          <MagneticButton strength={0.2}>
            <Button
              size="lg"
              className="group relative h-14 overflow-hidden rounded-full px-10 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
              asChild
            >
              <Link to="/signup">
                <span className="relative z-10">{t("landing.hero.cta")}</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  initial={false}
                />
              </Link>
            </Button>
          </MagneticButton>

          <MagneticButton strength={0.15}>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-2 bg-background/50 px-10 text-base font-semibold backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
              asChild
            >
              <a href="#pricing">{t("landing.hero.ctaSecondary")}</a>
            </Button>
          </MagneticButton>
        </FadeIn>

        <FadeIn delay={1.2} className="mt-20">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Setup in 5 minutes</span>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
