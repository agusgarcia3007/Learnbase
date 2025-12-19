import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Calendar, Ellipsis, Layers, ListFilter, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@learnbase/ui";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { ModuleEditor } from "@/components/modules";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useGetModules, useDeleteModule, useBulkDeleteModules } from "@/services/modules";
import type { Module, ModuleStatus } from "@/services/modules";
import { createSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/$tenantSlug/content/modules")({
  head: () =>
    createSeoMeta({
      title: "Modules",
      description: "Manage your modules",
      noindex: true,
    }),
  component: ModulesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
  }),
});

const STATUS_VARIANTS: Record<ModuleStatus, "success" | "secondary"> = {
  published: "success",
  draft: "secondary",
};

function ModulesPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useGetModules({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [deleteModule, setDeleteModule] = useState<Module | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const deleteMutation = useDeleteModule();
  const bulkDeleteMutation = useBulkDeleteModules();

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;

  const handleOpenCreate = useCallback(() => {
    setEditModule(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((module: Module) => {
    setEditModule(module);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback((open: boolean) => {
    if (!open) {
      setEditorOpen(false);
      setEditModule(null);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteModule) return;
    deleteMutation.mutate(deleteModule.id, {
      onSuccess: () => setDeleteModule(null),
    });
  }, [deleteModule, deleteMutation]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setRowSelection({});
      },
    });
  }, [selectedIds, bulkDeleteMutation]);

  const columns = useMemo<ColumnDef<Module>[]>(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("modules.columns.title")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="space-y-px">
            <div className="font-medium text-foreground">{row.original.title}</div>
            {row.original.description && (
              <div className="text-muted-foreground text-xs line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
        size: 300,
        enableSorting: true,
        meta: {
          headerTitle: t("modules.columns.title"),
          skeleton: (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          ),
        },
      },
      {
        accessorKey: "itemsCount",
        id: "itemsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("modules.columns.items")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" size="sm" className="gap-1">
            <Layers className="size-3" />
            {row.original.itemsCount} {t("modules.itemsLabel")}
          </Badge>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("modules.columns.items"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("modules.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={STATUS_VARIANTS[status]} appearance="light" size="sm">
              {t(`modules.statuses.${status}`)}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("modules.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("modules.columns.createdAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("modules.columns.createdAt"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-7" mode="icon" variant="ghost">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={() => handleOpenEdit(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteModule(row.original)}
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, handleOpenEdit]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "status",
        label: t("modules.filters.status"),
        type: "multiselect",
        icon: <ListFilter className="size-3.5" />,
        options: [
          { value: "draft", label: t("modules.statuses.draft") },
          { value: "published", label: t("modules.statuses.published") },
        ],
      },
      {
        key: "createdAt",
        label: t("modules.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const modules = data?.modules ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("modules.title")}</h1>
          <p className="text-muted-foreground">{t("modules.description")}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("modules.create.button")}
        </Button>
      </div>

      <DataTable
        data={modules}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
        toolbarActions={
          selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("modules.bulkDelete.button", { count: selectedCount })}
            </Button>
          )
        }
        emptyState={{
          title: t("modules.empty.title"),
          description: t("modules.empty.description"),
          action: (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              {t("modules.create.button")}
            </Button>
          ),
        }}
      />

      <ModuleEditor
        module={editModule}
        open={editorOpen}
        onOpenChange={handleCloseEditor}
      />

      <DeleteDialog
        open={!!deleteModule}
        onOpenChange={(open) => !open && setDeleteModule(null)}
        title={t("modules.delete.title")}
        description={t("modules.delete.description", {
          name: deleteModule?.title,
        })}
        confirmValue={deleteModule?.title ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("modules.bulkDelete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("modules.bulkDelete.description", { count: selectedCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending
                ? t("common.deleting")
                : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
