import { useTranslation } from "react-i18next";
import { Clock, FileText, Brain, ArrowDown, Sparkles } from "lucide-react";
import SplitText from "@/components/SplitText";

const painPoints = [
  { icon: Clock, key: "time" },
  { icon: FileText, key: "content" },
  { icon: Brain, key: "quizzes" },
];

export function ProblemSolution() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-muted/30 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SplitText
            text={t("landing.problem.title")}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
            delay={30}
            duration={0.6}
            splitType="words"
            tag="h2"
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {painPoints.map((point, index) => (
              <div
                key={point.key}
                className="group relative rounded-2xl border border-border bg-card p-8 backdrop-blur-sm transition-all hover:border-red-500/30 hover:bg-red-500/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-red-500/10 p-3">
                  <point.icon className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t(`landing.problem.points.${point.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`landing.problem.points.${point.key}.description`)}
                </p>
              </div>
            ))}
          </div>

          <div className="my-16 flex justify-center">
            <div className="flex flex-col items-center">
              <ArrowDown className="h-8 w-8 animate-bounce text-primary" />
            </div>
          </div>

          <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-8 md:p-12">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
                <Sparkles className="h-4 w-4" />
                {t("landing.problem.solution.badge")}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">
              {t("landing.problem.solution.title")}
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("landing.problem.solution.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
