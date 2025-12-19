import { format, type Locale } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@learnbase/ui";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@learnbase/ui";

const locales: Record<string, Locale> = {
  es,
  en: enUS,
  pt: ptBR,
};

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  className,
  align = "start",
  disabled = false,
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const locale = locales[i18n.language] || enUS;

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 size-3.5" />
          {value?.from ? (
            value.to ? (
              <>
                {formatDate(value.from)} - {formatDate(value.to)}
              </>
            ) : (
              formatDate(value.from)
            )
          ) : (
            <span>{placeholder ?? t("filters.selectDateRange")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
