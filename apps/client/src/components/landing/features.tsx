import {
  BookOpen,
  Bot,
  Building2,
  MessageCircle,
  Palette,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function LandingFeatures() {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t("landing.features.courses.title"),
      description: t("landing.features.courses.description"),
    },
    {
      icon: Building2,
      title: t("landing.features.enterprise.title"),
      description: t("landing.features.enterprise.description"),
    },
    {
      icon: Bot,
      title: t("landing.features.ai.title"),
      description: t("landing.features.ai.description"),
    },
    {
      icon: MessageCircle,
      title: t("landing.features.whatsapp.title"),
      description: t("landing.features.whatsapp.description"),
    },
    {
      icon: Palette,
      title: t("landing.features.customization.title"),
      description: t("landing.features.customization.description"),
    },
    {
      icon: Users,
      title: t("landing.features.community.title"),
      description: t("landing.features.community.description"),
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="mx-auto max-w-5xl space-y-12 px-6 md:space-y-20">
        <div className="relative z-10 mx-auto max-w-xl space-y-4 text-center">
          <h2 className="text-balance text-3xl font-semibold md:text-4xl lg:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="relative mx-auto grid max-w-4xl divide-x divide-y divide-border border border-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="space-y-3 p-8 md:p-10">
              <div className="flex items-center gap-3">
                <feature.icon className="size-5 text-primary" />
                <h3 className="text-sm font-medium">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
