import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackgroundPattern } from "@/services/tenants/service";

type PatternSelectorProps = {
  value: BackgroundPattern | null | undefined;
  onChange: (pattern: BackgroundPattern) => void;
};

const PATTERNS: { id: BackgroundPattern; preview: string }[] = [
  { id: "none", preview: "" },
  {
    id: "grid",
    preview:
      "bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:8px_8px]",
  },
  {
    id: "dots",
    preview: "bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[size:8px_8px]",
  },
  {
    id: "waves",
    preview:
      "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='none' stroke='%23888' stroke-width='1' d='M0 16c8 0 8-8 16-8s8 8 16 8'/%3E%3C/svg%3E\")] bg-[size:32px_32px]",
  },
];

export function PatternSelector({ value, onChange }: PatternSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {PATTERNS.map((pattern) => {
        const isSelected = value === pattern.id;
        return (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onChange(pattern.id)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div
              className={cn(
                "size-8 shrink-0 rounded-md border border-border/50 bg-muted/50 text-muted-foreground/30",
                pattern.preview
              )}
            />
            <span className="text-sm font-medium">
              {t(`dashboard.site.customization.patternOptions.${pattern.id}`)}
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
