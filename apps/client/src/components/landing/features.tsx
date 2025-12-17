import {
  Bot,
  CreditCard,
  FileVideo,
  Globe,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { key: "videoAnalysis", icon: FileVideo },
  { key: "quizGeneration", icon: HelpCircle },
  { key: "aiAgent", icon: Bot },
  { key: "whiteLabel", icon: Globe },
  { key: "certificates", icon: GraduationCap },
  { key: "payments", icon: CreditCard },
];

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.key} className="border-border/50">
              <CardContent className="p-6">
                <feature.icon className="mb-4 h-10 w-10 text-primary" />
                <h3 className="text-lg font-semibold">
                  {t(`landing.features.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`landing.features.${feature.key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
