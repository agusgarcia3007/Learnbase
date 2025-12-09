import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
  type OnChangeFn,
} from "@tanstack/react-table";

import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
} from "@/components/ui/card";
import { DataGrid, DataGridPagination, DataGridTable } from "@/components/ui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Filters, type FilterFieldConfig } from "@/components/ui/filters";

import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableEmpty } from "./data-table-empty";
import { getFiltersI18n } from "./data-table-filters-i18n";
import { useFiltersUrlSync } from "./use-filters-url-sync";
import type { useDataTableState } from "@/hooks/use-data-table-state";

type PaginationInfo = {
  total: number;
  totalPages: number;
} | null;

type EmptyStateConfig = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: PaginationInfo;
  isLoading?: boolean;
  tableState: ReturnType<typeof useDataTableState>;
  filterFields?: FilterFieldConfig[];
  toolbarActions?: ReactNode;
  searchPlaceholder?: string;
  emptyState?: EmptyStateConfig;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData>({
  data,
  columns,
  pagination,
  isLoading = false,
  tableState,
  filterFields,
  toolbarActions,
  searchPlaceholder,
  emptyState,
  enableRowSelection,
  rowSelection,
  onRowSelectionChange,
  getRowId,
}: DataTableProps<TData>) {
  const { t } = useTranslation();
  const { params, sortState, setPage, setLimit, setSort, setSearch, setFilters } = tableState;

  const pageCount = pagination?.totalPages ?? 0;
  const recordCount = pagination?.total ?? 0;

  const sorting: SortingState = sortState
    ? [{ id: sortState.field, desc: sortState.order === "desc" }]
    : [];

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const newSorting = typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting.length === 0) {
      setSort(undefined);
    } else {
      setSort({
        field: newSorting[0].id,
        order: newSorting[0].desc ? "desc" : "asc",
      });
    }
  };

  const table = useReactTable({
    columns,
    data,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection,
    getRowId,
    state: {
      pagination: {
        pageIndex: params.page - 1,
        pageSize: params.limit,
      },
      sorting,
      rowSelection: rowSelection ?? {},
    },
    onPaginationChange: (updater) => {
      const currentPagination = { pageIndex: params.page - 1, pageSize: params.limit };
      const newPagination =
        typeof updater === "function"
          ? updater(currentPagination)
          : updater;
      if (newPagination.pageSize !== currentPagination.pageSize) {
        setLimit(newPagination.pageSize);
      } else if (newPagination.pageIndex !== currentPagination.pageIndex) {
        setPage(newPagination.pageIndex + 1);
      }
    },
    onSortingChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
  });

  const filtersI18n = getFiltersI18n(t);

  const { activeFilters, handleFiltersChange } = useFiltersUrlSync({
    filterFields,
    params,
    setFilters,
  });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <DataGrid table={table as any} recordCount={recordCount} isLoading={isLoading}>
      <Card>
        <CardHeader className="py-4">
          <CardHeading className="flex-1">
            <DataTableToolbar
              searchValue={params.search}
              onSearchChange={setSearch}
              searchPlaceholder={searchPlaceholder}
              actions={toolbarActions}
            >
              {filterFields && filterFields.length > 0 && (
                <Filters
                  filters={activeFilters}
                  fields={filterFields}
                  onChange={handleFiltersChange}
                  i18n={filtersI18n}
                  size="sm"
                />
              )}
            </DataTableToolbar>
          </CardHeading>
        </CardHeader>
        {emptyState && data.length === 0 && !isLoading ? (
          <DataTableEmpty {...emptyState} />
        ) : (
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
        )}
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
