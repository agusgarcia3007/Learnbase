import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES } from "./schema";
import type { TenantTheme } from "@/services/tenants/service";

type ThemeSelectorProps = {
  value: TenantTheme | null | undefined;
  onChange: (theme: TenantTheme) => void;
};

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation();
  const selectedTheme = THEMES.find((theme) => theme.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {THEMES.map((theme) => {
          const isSelected = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              className={cn(
                "relative size-9 rounded-full transition-all duration-200",
                "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              style={{ backgroundColor: theme.color }}
              title={t(`dashboard.site.configuration.branding.themes.${theme.id}`)}
            >
              {isSelected && (
                <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
      {selectedTheme && (
        <p className="text-sm text-muted-foreground">
          {t(`dashboard.site.configuration.branding.themes.${selectedTheme.id}`)}
        </p>
      )}
    </div>
  );
}
