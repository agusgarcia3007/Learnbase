import {
  BookOpen,
  Bot,
  Building2,
  MessageCircle,
  Palette,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import MagicBento, { type BentoCardProps } from "@/components/MagicBento";

export function LandingFeatures() {
  const { t } = useTranslation();

  const cards: BentoCardProps[] = [
    {
      icon: BookOpen,
      title: t("landing.features.courses.title"),
      description: t("landing.features.courses.description"),
      label: t("landing.features.courses.label"),
    },
    {
      icon: Building2,
      title: t("landing.features.enterprise.title"),
      description: t("landing.features.enterprise.description"),
      label: t("landing.features.enterprise.label"),
    },
    {
      icon: Bot,
      title: t("landing.features.ai.title"),
      description: t("landing.features.ai.description"),
      label: t("landing.features.ai.label"),
    },
    {
      icon: MessageCircle,
      title: t("landing.features.whatsapp.title"),
      description: t("landing.features.whatsapp.description"),
      label: t("landing.features.whatsapp.label"),
    },
    {
      icon: Palette,
      title: t("landing.features.customization.title"),
      description: t("landing.features.customization.description"),
      label: t("landing.features.customization.label"),
    },
    {
      icon: Users,
      title: t("landing.features.community.title"),
      description: t("landing.features.community.description"),
      label: t("landing.features.community.label"),
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

        <MagicBento
          cards={cards}
          textAutoHide={false}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          clickEffect={true}
          enableMagnetism={true}
          enableTilt={false}
          glowColor="132, 0, 255"
        />
      </div>
    </section>
  );
}
