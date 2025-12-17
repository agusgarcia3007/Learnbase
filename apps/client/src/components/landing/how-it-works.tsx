import { Upload, Wand2, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  { icon: Upload, key: "upload" },
  { icon: Wand2, key: "process" },
  { icon: Rocket, key: "publish" },
];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("landing.howItWorks.title")}
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.key} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {index + 1}
              </div>
              <div className="mt-4 flex justify-center">
                <step.icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-3 font-semibold">
                {t(`landing.howItWorks.steps.${step.key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`landing.howItWorks.steps.${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
