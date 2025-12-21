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
import { cn } from "@/lib/utils";

const features = [
  { key: "videoAnalysis", icon: FileVideo, span: "lg:col-span-2" },
  { key: "quizGeneration", icon: HelpCircle, span: "" },
  { key: "aiAgent", icon: Bot, span: "" },
  { key: "whiteLabel", icon: Globe, span: "lg:col-span-2" },
  { key: "certificates", icon: GraduationCap, span: "" },
  { key: "payments", icon: CreditCard, span: "" },
] as const;

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section id="features" className="relative overflow-hidden bg-muted/30 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            {t("landing.features.eyebrow", { defaultValue: "Features" })}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                feature.span
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="size-6 text-primary" />
                </div>

                <h3 className="mb-2 text-lg font-semibold">
                  {t(`landing.features.${feature.key}.title`)}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.features.${feature.key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
