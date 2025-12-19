import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";

type ExportButtonProps = {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportSelectedCSV?: () => void;
  onExportSelectedExcel?: () => void;
  selectedCount?: number;
  disabled?: boolean;
};

export function ExportButton({
  onExportCSV,
  onExportExcel,
  onExportSelectedCSV,
  onExportSelectedExcel,
  selectedCount = 0,
  disabled = false,
}: ExportButtonProps) {
  const { t } = useTranslation();
  const hasSelection = selectedCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="size-4" />
          {t("dataTable.export.button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onExportCSV}>
          <FileText className="mr-2 size-4" />
          {t("dataTable.export.csv")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel}>
          <FileSpreadsheet className="mr-2 size-4" />
          {t("dataTable.export.excel")}
        </DropdownMenuItem>
        {hasSelection && onExportSelectedCSV && onExportSelectedExcel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportSelectedCSV}>
              <FileText className="mr-2 size-4" />
              {t("dataTable.export.selectedCsv", { count: selectedCount })}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSelectedExcel}>
              <FileSpreadsheet className="mr-2 size-4" />
              {t("dataTable.export.selectedExcel", { count: selectedCount })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
