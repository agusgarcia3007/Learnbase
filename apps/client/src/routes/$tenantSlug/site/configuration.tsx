import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$tenantSlug/site/configuration")({
  component: ConfigurationPage,
});

function ConfigurationPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t("dashboard.site.configuration.title")}
      </h1>
      <p className="text-muted-foreground mt-2">
        {t("dashboard.site.configuration.description")}
      </p>
    </div>
  );
}
