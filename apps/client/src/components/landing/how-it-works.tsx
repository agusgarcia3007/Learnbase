import { Upload, Cpu, Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const steps = [
  { icon: Upload, key: "upload", number: "01" },
  { icon: Cpu, key: "process", number: "02" },
  { icon: Rocket, key: "publish", number: "03" },
];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            {t("landing.howItWorks.eyebrow", { defaultValue: "Simple Process" })}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("landing.howItWorks.title")}
          </h2>
        </motion.div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-10 hidden h-0.5 bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.key}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="relative z-10 mb-8">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <step.icon className="size-8" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-background text-xs font-bold text-primary ring-2 ring-primary">
                    {step.number}
                  </div>
                </div>

                <h3 className="mb-3 text-xl font-semibold">
                  {t(`landing.howItWorks.steps.${step.key}.title`)}
                </h3>

                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.howItWorks.steps.${step.key}.description`)}
                </p>

                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-10 hidden text-muted-foreground/30 md:block lg:-right-2">
                    <ArrowRight className="size-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
