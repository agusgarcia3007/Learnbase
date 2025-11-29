import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/$tenantSlug/site/customization")({
  component: CustomizationPage,
});

function CustomizationPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          {t("dashboard.site.customization.title")}
        </h1>
        <Badge variant="secondary">{t("dashboard.sidebar.comingSoon")}</Badge>
      </div>
      <p className="text-muted-foreground mt-2">
        {t("dashboard.site.customization.description")}
      </p>
    </div>
  );
}
