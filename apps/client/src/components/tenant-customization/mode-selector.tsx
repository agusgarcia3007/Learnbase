import { useTranslation } from "react-i18next";
import { Check, Sun, Moon, Monitor } from "lucide-react";
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
    <div className="grid grid-cols-3 gap-3">
      {MODES.map((mode) => {
        const isSelected = value === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <Icon className="size-5" />
            <span className="text-sm font-medium">
              {t(`dashboard.site.customization.modes.${mode.id}`)}
            </span>
            {isSelected && (
              <Check className="absolute right-2 top-2 size-4 text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
