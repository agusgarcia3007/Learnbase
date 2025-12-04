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

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map((theme) => {
        const isSelected = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div
              className="size-6 shrink-0 rounded-full ring-2 ring-border/50"
              style={{ backgroundColor: theme.color }}
            />
            <span className="text-sm font-medium capitalize">
              {t(
                `dashboard.site.configuration.branding.themes.${theme.id}`
              )}
            </span>
            {isSelected && (
              <Check className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
