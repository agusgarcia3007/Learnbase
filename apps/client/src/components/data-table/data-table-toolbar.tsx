import { useCallback, useState, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type DataTableToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  actions?: ReactNode;
  debounceMs?: number;
};

export function DataTableToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
  children,
  actions,
  debounceMs = 300,
}: DataTableToolbarProps) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearchChangeRef.current?.(localSearch);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localSearch, debounceMs]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearchChange?.(localSearch);
    },
    [onSearchChange, localSearch]
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {onSearchChange && (
          <form onSubmit={handleSubmit} className="shrink-0">
            <InputGroup className="w-full sm:w-64">
              <InputGroupInput
                placeholder={searchPlaceholder ?? t("dataTable.search")}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit" variant="dim" size="icon-xs">
                  <Search />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
