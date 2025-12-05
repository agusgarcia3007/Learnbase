import { useTranslation } from "react-i18next";
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
      "bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:6px_6px]",
  },
  {
    id: "dots",
    preview: "bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[size:6px_6px]",
  },
  {
    id: "waves",
    preview:
      "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='none' stroke='%23888' stroke-width='1' d='M0 16c8 0 8-8 16-8s8 8 16 8'/%3E%3C/svg%3E\")] bg-[size:24px_24px]",
  },
];

export function PatternSelector({ value, onChange }: PatternSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      {PATTERNS.map((pattern) => {
        const isSelected = value === pattern.id;
        return (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onChange(pattern.id)}
            className="group flex flex-col items-center gap-2"
          >
            <div
              className={cn(
                "size-14 rounded-lg border-2 bg-muted/50 text-muted-foreground/40 transition-all",
                "group-hover:scale-105 group-hover:border-primary/50",
                "group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-ring",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border",
                pattern.preview
              )}
            />
            <span
              className={cn(
                "text-xs transition-colors",
                isSelected ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {t(`dashboard.site.customization.patternOptions.${pattern.id}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
