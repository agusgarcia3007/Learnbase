import { useState, useRef, useEffect, useCallback } from "react";
import type { Filter, FilterFieldConfig } from "@/components/ui/filters";

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

  const urlFiltersToFilters = useCallback((): Filter[] => {
    if (!filterFields) return [];

    const filters: Filter[] = [];
    for (const field of filterFields) {
      if (!field.key) continue;
      const value = params[field.key];
      if (value && typeof value === "string") {
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
  }, [filterFields, params]);

  const syncFiltersToUrl = useCallback((filters: Filter[]) => {
    const filterParams: Record<string, string | undefined> = {};

    if (filterFields) {
      for (const field of filterFields) {
        if (field.key) {
          filterParams[field.key] = undefined;
        }
      }
    }

    for (const filter of filters) {
      const valuesStr = filter.values.join(",");
      filterParams[filter.field] = `${filter.operator}:${valuesStr}`;
    }

    setFilters(filterParams);
  }, [filterFields, setFilters]);

  const urlFilters = urlFiltersToFilters();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setLocalFilters(urlFilters);
    }
  }, []);

  useEffect(() => {
    if (!isInitialMount.current && localFilters !== urlFilters) {
      setLocalFilters(urlFilters);
    }
  }, [params]);

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
