import { Upload, Cpu, Rocket } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FadeIn } from "@/components/ui/fade-in";

const steps = [
  { icon: Upload, key: "upload", number: "01" },
  { icon: Cpu, key: "process", number: "02" },
  { icon: Rocket, key: "publish", number: "03" },
];

export function HowItWorks() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        <FadeIn className="mb-20 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.howItWorks.title")}
          </h2>
        </FadeIn>

        <div ref={containerRef} className="relative">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block">
            <motion.div
              className="h-full w-full bg-gradient-to-b from-primary via-primary to-transparent"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          <div className="space-y-16 md:space-y-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.key}
                  className={`flex flex-col items-center gap-8 md:flex-row ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div
                    className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}
                  >
                    <motion.div
                      className="inline-block"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
                        <div
                          className={`mb-4 flex items-center gap-3 ${
                            isEven ? "md:justify-end" : "md:justify-start"
                          }`}
                        >
                          <span className="text-sm font-bold text-primary">
                            Step {step.number}
                          </span>
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                          {t(`landing.howItWorks.steps.${step.key}.title`)}
                        </h3>
                        <p className="text-muted-foreground">
                          {t(`landing.howItWorks.steps.${step.key}.description`)}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="relative z-10 flex items-center justify-center">
                    <motion.div
                      className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/30"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <step.icon className="h-9 w-9 text-white" />
                    </motion.div>
                    <motion.div
                      className="absolute -inset-2 rounded-2xl bg-primary/20"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3,
                      }}
                    />
                  </div>

                  <div className="hidden flex-1 md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
