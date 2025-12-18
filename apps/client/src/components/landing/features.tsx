import {
  Bot,
  CreditCard,
  FileVideo,
  Globe,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

const features = [
  { key: "videoAnalysis", icon: FileVideo, size: "large" },
  { key: "quizGeneration", icon: HelpCircle, size: "small" },
  { key: "aiAgent", icon: Bot, size: "small" },
  { key: "whiteLabel", icon: Globe, size: "small" },
  { key: "certificates", icon: GraduationCap, size: "small" },
  { key: "payments", icon: CreditCard, size: "large" },
] as const;

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </FadeIn>

        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
          {features.map((feature, index) => {
            const isLarge = feature.size === "large";
            const gridClass = isLarge
              ? index === 0
                ? "md:col-span-2 md:row-span-2"
                : "md:col-span-2"
              : "md:col-span-1";

            return (
              <StaggerItem key={feature.key} className={gridClass}>
                <SpotlightCard
                  className="group h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-colors duration-300 hover:border-primary/30 hover:bg-card"
                  spotlightColor="hsl(var(--primary) / 0.1)"
                >
                  <div className={`flex h-full flex-col ${isLarge ? "p-8" : "p-6"}`}>
                    <motion.div
                      className={`mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ${
                        isLarge ? "h-16 w-16" : "h-12 w-12"
                      }`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <feature.icon
                        className={`text-primary ${isLarge ? "h-8 w-8" : "h-6 w-6"}`}
                      />
                    </motion.div>

                    <h3
                      className={`mb-2 font-semibold ${
                        isLarge ? "text-xl" : "text-lg"
                      }`}
                    >
                      {t(`landing.features.${feature.key}.title`)}
                    </h3>

                    <p
                      className={`leading-relaxed text-muted-foreground ${
                        isLarge ? "text-base" : "text-sm"
                      }`}
                    >
                      {t(`landing.features.${feature.key}.description`)}
                    </p>

                    {isLarge && index === 0 && (
                      <div className="mt-auto pt-6">
                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <span className="text-sm font-bold text-primary">AI</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-3/4 rounded-full bg-primary/20" />
                            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-muted-foreground/20" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
