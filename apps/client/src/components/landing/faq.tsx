import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

const faqItems = ["ai", "domain", "data", "pricing"];

export function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />

      <div className="relative mx-auto max-w-[800px] px-6">
        <FadeIn className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.faq.title")}
          </h2>
        </FadeIn>

        <StaggerContainer staggerDelay={0.1} className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <StaggerItem key={item}>
                <motion.div
                  className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm"
                  animate={{
                    borderColor: isOpen
                      ? "hsl(var(--primary) / 0.3)"
                      : "hsl(var(--border) / 0.5)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-muted/30"
                  >
                    <span className="text-lg font-semibold">
                      {t(`landing.faq.items.${item}.question`)}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="border-t border-border/50 px-6 py-4">
                          <p className="leading-relaxed text-muted-foreground">
                            {t(`landing.faq.items.${item}.answer`)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
