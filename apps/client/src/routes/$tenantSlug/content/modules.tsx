import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Ellipsis, Layers, ListFilter, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { ModuleEditor } from "@/components/modules";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useGetModules, useDeleteModule } from "@/services/modules";
import { modulesListOptions } from "@/services/modules/options";
import type { Module, ModuleStatus } from "@/services/modules";

export const Route = createFileRoute("/$tenantSlug/content/modules")({
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(modulesListOptions({ page: 1, limit: 10 }));
  },
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

  const deleteMutation = useDeleteModule();

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

  const columns = useMemo<ColumnDef<Module>[]>(
    () => [
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
        accessorKey: "lessonsCount",
        id: "lessonsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("modules.columns.lessons")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" size="sm" className="gap-1">
            <Layers className="size-3" />
            {row.original.lessonsCount} {t("modules.lessonsLabel")}
          </Badge>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("modules.columns.lessons"),
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
    </div>
  );
}
