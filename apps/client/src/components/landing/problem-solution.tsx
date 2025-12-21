import { Clock, FileText, HelpCircle, Sparkles, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const problems = [
  { key: "time", icon: Clock },
  { key: "content", icon: FileText },
  { key: "quizzes", icon: HelpCircle },
];

export function ProblemSolution() {
  const { t } = useTranslation();

  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-destructive">
            {t("landing.problem.eyebrow", { defaultValue: "The Problem" })}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("landing.problem.title")}
            <span className="text-primary">{t("landing.problem.titleHighlight")}</span>
          </h2>
        </motion.div>

        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.key}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-border hover:shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="absolute -right-4 -top-4 text-[8rem] font-bold leading-none text-muted/20 transition-transform group-hover:scale-110">
                {index + 1}
              </div>

              <div className="relative">
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-destructive/10">
                  <problem.icon className="size-6 text-destructive" />
                </div>

                <h3 className="mb-2 text-lg font-semibold">
                  {t(`landing.problem.points.${problem.key}.title`)}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.problem.points.${problem.key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex size-12 items-center justify-center rounded-full border border-border/50 bg-muted/50">
            <ArrowDown className="size-5 animate-bounce text-muted-foreground" />
          </div>
        </motion.div>

        <motion.div
          className="mx-auto mt-16 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Sparkles className="size-4" />
            <span className="font-medium">{t("landing.problem.solution.badge")}</span>
          </div>

          <h3 className="mb-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {t("landing.problem.solution.title")}
            <span className="text-primary">{t("landing.problem.solution.titleHighlight")}</span>
            {t("landing.problem.solution.titleEnd")}
          </h3>

          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("landing.problem.solution.description")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
