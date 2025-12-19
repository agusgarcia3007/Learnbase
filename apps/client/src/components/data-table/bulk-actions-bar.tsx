import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@learnbase/ui";

type BulkActionsBarProps = {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
};

export function BulkActionsBar({
  selectedCount,
  onClear,
  children,
}: BulkActionsBarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-primary">
          {t("dataTable.bulk.selected", { count: selectedCount })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 size-3.5" />
          {t("dataTable.bulk.clearSelection")}
        </Button>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
