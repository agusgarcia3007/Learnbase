import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { BlurText } from "@/components/ui/blur-text";
import { FadeIn } from "@/components/ui/fade-in";
import { MagneticButton } from "@/components/ui/magnetic-button";

export function CTA() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <motion.div
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-500/20 blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[700px] px-6 text-center">
        <FadeIn>
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            <BlurText duration={0.6}>{t("landing.cta.title")}</BlurText>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            {t("landing.cta.subtitle")}
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <MagneticButton strength={0.2} className="mt-10">
            <Button
              size="lg"
              className="group relative h-14 overflow-hidden rounded-full px-12 text-base font-semibold shadow-lg shadow-primary/25"
              asChild
            >
              <Link to="/signup">
                <span className="relative z-10">{t("landing.cta.button")}</span>
                <motion.div
                  className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-violet-500 to-primary bg-[length:200%_100%]"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </Link>
            </Button>
          </MagneticButton>
        </FadeIn>
      </div>
    </section>
  );
}
