import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export type SortOrder = "asc" | "desc";

export type SortState = {
  field: string;
  order: SortOrder;
};

export type DataTableParams = {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  [key: string]: string | number | undefined;
};

type UseDataTableStateConfig = {
  defaultLimit?: number;
  defaultSort?: SortState;
};

export function useDataTableState(config: UseDataTableStateConfig = {}) {
  const { defaultLimit = 10, defaultSort } = config;

  const searchParams = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();

  const params = useMemo<DataTableParams>(() => {
    const page = Number(searchParams.page) || 1;
    const limit = Number(searchParams.limit) || defaultLimit;
    const sort =
      (searchParams.sort as string) ||
      (defaultSort ? `${defaultSort.field}:${defaultSort.order}` : undefined);
    const search = (searchParams.search as string) || undefined;

    const result: DataTableParams = { page, limit, sort, search };

    for (const [key, value] of Object.entries(searchParams)) {
      if (!["page", "limit", "sort", "search"].includes(key) && value) {
        result[key] = String(value);
      }
    }

    return result;
  }, [searchParams, defaultLimit, defaultSort]);

  const sortState = useMemo<SortState | undefined>(() => {
    const urlSort = searchParams.sort as string | undefined;
    if (urlSort) {
      const [field, order] = urlSort.split(":");
      if (field && order) {
        return { field, order: order as SortOrder };
      }
    }
    return defaultSort;
  }, [searchParams.sort, defaultSort]);

  const updateParams = useCallback(
    (updates: Partial<DataTableParams>) => {
      const newParams = { ...searchParams };

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === null) {
          delete newParams[key];
        } else {
          newParams[key] = String(value);
        }
      }

      void navigate({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search: newParams as any,
        replace: true,
      });
    },
    [navigate, searchParams]
  );

  const setPage = useCallback(
    (page: number) => {
      updateParams({ page });
    },
    [updateParams]
  );

  const setLimit = useCallback(
    (limit: number) => {
      updateParams({ limit, page: 1 });
    },
    [updateParams]
  );

  const setSort = useCallback(
    (sort: SortState | undefined) => {
      if (!sort) {
        updateParams({ sort: undefined, page: 1 });
      } else {
        updateParams({ sort: `${sort.field}:${sort.order}`, page: 1 });
      }
    },
    [updateParams]
  );

  const setSearch = useCallback(
    (search: string) => {
      updateParams({ search: search || undefined, page: 1 });
    },
    [updateParams]
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      updateParams({ [key]: value, page: 1 });
    },
    [updateParams]
  );

  const setFilters = useCallback(
    (filters: Record<string, string | undefined>) => {
      updateParams({ ...filters, page: 1 });
    },
    [updateParams]
  );

  const resetFilters = useCallback(() => {
    const newParams: Record<string, string | undefined> = {
      page: "1",
      limit: String(params.limit),
    };
    if (params.sort) {
      newParams.sort = params.sort;
    }
    void navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: newParams as any,
      replace: true,
    });
  }, [navigate, params.limit, params.sort]);

  const getFilterValue = useCallback(
    (key: string): string | undefined => {
      const value = params[key] as string | undefined;
      if (!value) return undefined;
      const colonIndex = value.indexOf(":");
      return colonIndex > 0 ? value.substring(colonIndex + 1) : value;
    },
    [params]
  );

  const serverParams = useMemo(() => {
    const result: DataTableParams = {
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      search: params.search,
    };

    for (const [key, value] of Object.entries(params)) {
      if (["page", "limit", "sort", "search"].includes(key)) continue;
      if (typeof value === "string" && value) {
        result[key] = value;
      }
    }

    return result;
  }, [params]);

  return {
    params,
    serverParams,
    sortState,
    setPage,
    setLimit,
    setSort,
    setSearch,
    setFilter,
    setFilters,
    resetFilters,
    getFilterValue,
  };
}
