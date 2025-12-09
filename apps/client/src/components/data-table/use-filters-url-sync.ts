import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { Filter, FilterFieldConfig } from "@/components/ui/filters";

function areFiltersEqual(a: Filter[], b: Filter[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((filter, i) =>
    filter.field === b[i].field &&
    filter.operator === b[i].operator &&
    filter.values.join(",") === b[i].values.join(",")
  );
}

interface UseFiltersUrlSyncOptions {
  filterFields?: FilterFieldConfig[];
  params: Record<string, unknown>;
  setFilters: (filters: Record<string, string | undefined>) => void;
  debounceMs?: number;
}

function getDefaultOperator(fieldType: string | undefined): string {
  switch (fieldType) {
    case "multiselect":
    case "select":
      return "is";
    case "daterange":
      return "between";
    case "text":
      return "contains";
    default:
      return "is";
  }
}

export function useFiltersUrlSync({
  filterFields,
  params,
  setFilters,
  debounceMs = 300,
}: UseFiltersUrlSyncOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localFilters, setLocalFilters] = useState<Filter[]>([]);
  const isInitialMount = useRef(true);
  const prevUrlFiltersRef = useRef<Filter[]>([]);

  const filterKeys = useMemo(
    () => filterFields?.map((f) => f.key).filter(Boolean) ?? [],
    [filterFields]
  );

  const filterParams = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of filterKeys) {
      if (key && params[key] && typeof params[key] === "string") {
        result[key] = params[key] as string;
      }
    }
    return result;
  }, [filterKeys, params]);

  const filterParamsKey = useMemo(
    () => JSON.stringify(filterParams),
    [filterParams]
  );

  const urlFilters = useMemo((): Filter[] => {
    if (!filterFields) return [];

    const filters: Filter[] = [];
    for (const field of filterFields) {
      if (!field.key) continue;
      const value = filterParams[field.key];
      if (value) {
        const colonIndex = value.indexOf(":");
        let operator: string;
        let rawValues: string;

        if (colonIndex > 0) {
          operator = value.substring(0, colonIndex);
          rawValues = value.substring(colonIndex + 1);
        } else {
          operator = field.defaultOperator ?? getDefaultOperator(field.type);
          rawValues = value;
        }

        filters.push({
          id: `${field.key}-filter`,
          field: field.key,
          operator,
          values: rawValues ? rawValues.split(",") : [""],
        });
      }
    }
    return filters;
  }, [filterFields, filterParamsKey]);

  const syncFiltersToUrl = useCallback((filters: Filter[]) => {
    const newFilterParams: Record<string, string | undefined> = {};

    if (filterFields) {
      for (const field of filterFields) {
        if (field.key) {
          newFilterParams[field.key] = undefined;
        }
      }
    }

    for (const filter of filters) {
      const valuesStr = filter.values.join(",");
      newFilterParams[filter.field] = `${filter.operator}:${valuesStr}`;
    }

    setFilters(newFilterParams);
  }, [filterFields, setFilters]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setLocalFilters(urlFilters);
      prevUrlFiltersRef.current = urlFilters;
      return;
    }

    if (!areFiltersEqual(prevUrlFiltersRef.current, urlFilters)) {
      setLocalFilters(urlFilters);
      prevUrlFiltersRef.current = urlFilters;
    }
  }, [urlFilters]);

  const handleFiltersChange = useCallback((newFilters: Filter[]) => {
    setLocalFilters(newFilters);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      syncFiltersToUrl(newFilters);
    }, debounceMs);
  }, [syncFiltersToUrl, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const activeFilters = localFilters.length > 0 ? localFilters : urlFilters;

  return {
    activeFilters,
    handleFiltersChange,
  };
}
