import { Clock, FileText, HelpCircle, Sparkles, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

const problems = [
  { key: "time", icon: Clock },
  { key: "content", icon: FileText },
  { key: "quizzes", icon: HelpCircle },
];

export function ProblemSolution() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-muted/30 to-transparent" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        <FadeIn className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.problem.title")}
          </h2>
        </FadeIn>

        <StaggerContainer staggerDelay={0.15} className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {problems.map((problem, index) => (
            <StaggerItem key={problem.key}>
              <SpotlightCard
                className="group h-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-destructive/30"
                spotlightColor="hsl(var(--destructive) / 0.1)"
              >
                <div className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10"
                      whileHover={{ rotate: -10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <problem.icon className="h-6 w-6 text-destructive/70" />
                    </motion.div>
                    <span className="text-4xl font-bold text-muted-foreground/20">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mb-3 text-lg font-semibold">
                    {t(`landing.problem.points.${problem.key}.title`)}
                  </h3>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.problem.points.${problem.key}.description`)}
                  </p>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn className="flex justify-center">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="h-5 w-5 text-primary" />
          </motion.div>
        </FadeIn>

        <FadeIn delay={0.2} className="mx-auto mt-16 max-w-[800px] text-center">
          <motion.div
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/5 px-5 py-2.5"
            animate={{
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.1)",
                "0 0 40px hsl(var(--primary) / 0.2)",
                "0 0 20px hsl(var(--primary) / 0.1)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t("landing.problem.solution.badge")}
            </span>
          </motion.div>

          <h3 className="mb-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("landing.problem.solution.title")}
          </h3>

          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("landing.problem.solution.description")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
