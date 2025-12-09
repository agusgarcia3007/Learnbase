import { useTranslation } from "react-i18next";
import { Upload, Wand2, Rocket } from "lucide-react";
import SplitText from "@/components/SplitText";
import BlurText from "@/components/BlurText";

const steps = [
  { icon: Upload, key: "upload", number: "01" },
  { icon: Wand2, key: "generate", number: "02" },
  { icon: Rocket, key: "launch", number: "03" },
];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="features" className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <BlurText
            text={t("landing.howItWorks.title")}
            className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
            delay={50}
            animateBy="words"
          />
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landing.howItWorks.subtitle")}
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className="group relative"
            >
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-16 hidden h-0.5 w-full bg-gradient-to-r from-violet-500/50 to-transparent md:block" />
              )}

              <div className="relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10">
                <div className="absolute -top-4 right-4">
                  <span className="text-5xl font-bold text-violet-500/20">
                    {step.number}
                  </span>
                </div>

                <div className="mb-6 inline-flex rounded-2xl bg-violet-500/10 p-4">
                  <step.icon className="h-8 w-8 text-violet-500" />
                </div>

                <h3 className="mb-3 text-xl font-semibold">
                  {t(`landing.howItWorks.steps.${step.key}.title`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`landing.howItWorks.steps.${step.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
