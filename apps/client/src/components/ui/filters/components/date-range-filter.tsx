import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@learnbase/ui";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useFilterContext } from "../filter-context";
import { filterFieldValueVariants } from "../filter-variants";

interface DateRangeFilterProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  toLabel: string;
}

export function DateRangeFilter({
  values,
  onChange,
  placeholder,
  className,
  toLabel,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const context = useFilterContext();
  const startDate = values[0] || "";
  const endDate = values[1] || "";

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return parse(dateStr, "yyyy-MM-dd", new Date());
    } catch {
      return undefined;
    }
  };

  const formatDateForStorage = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const formatDisplayDate = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy");
  };

  const savedRange: DateRange | undefined =
    startDate || endDate
      ? {
          from: parseDate(startDate),
          to: parseDate(endDate),
        }
      : undefined;

  const [tempRange, setTempRange] = useState<DateRange | undefined>(savedRange);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from || range?.to) {
      const fromStr = formatDateForStorage(range?.from);
      const toStr = formatDateForStorage(range?.to);
      onChange([fromStr, toStr]);
      if (range?.from && range?.to) {
        setOpen(false);
      }
    }
  };

  const displayRange = open ? tempRange : savedRange;

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          setTempRange(savedRange);
        }
      }}
    >
      <PopoverTrigger
        className={cn(
          filterFieldValueVariants({
            variant: context.variant,
            size: context.size,
            cursorPointer: context.cursorPointer,
          }),
          !displayRange?.from && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="size-3.5 opacity-60" />
        {displayRange?.from ? (
          displayRange.to ? (
            <>
              {formatDisplayDate(displayRange.from)} {toLabel}{" "}
              {formatDisplayDate(displayRange.to)}
            </>
          ) : (
            formatDisplayDate(displayRange.from)
          )
        ) : (
          <span>{placeholder || context.i18n.selectDateRange}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={displayRange?.from}
          selected={tempRange}
          onSelect={handleDateRangeSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
