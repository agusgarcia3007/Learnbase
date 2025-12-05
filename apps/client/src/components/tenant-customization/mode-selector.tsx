import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenantMode } from "@/services/tenants/service";

const MODES: { id: TenantMode; icon: typeof Sun }[] = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "auto", icon: Monitor },
];

type ModeSelectorProps = {
  value: TenantMode | null | undefined;
  onChange: (mode: TenantMode) => void;
};

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex rounded-lg border bg-muted/30 p-1">
      {MODES.map((mode) => {
        const isSelected = value === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-4 py-2 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span className="text-xs font-medium">
              {t(`dashboard.site.customization.modes.${mode.id}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
