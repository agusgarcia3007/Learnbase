import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Ellipsis, Calendar } from "lucide-react";

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
import { EditTenantDialog } from "@/components/backoffice/edit-tenant-dialog";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useGetTenantsList, useDeleteTenant, useUpdateTenant } from "@/services/tenants";
import type { Tenant } from "@/services/tenants/service";

export const Route = createFileRoute("/backoffice/tenants")({
  component: BackofficeTenants,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    createdAt: (search.createdAt as string) || undefined,
  }),
});

function BackofficeTenants() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useGetTenantsList({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);

  const updateMutation = useUpdateTenant();
  const deleteMutation = useDeleteTenant();

  const handleDelete = () => {
    if (!deleteTenant) return;
    deleteMutation.mutate(deleteTenant.id, {
      onSuccess: () => setDeleteTenant(null),
    });
  };

  const handleUpdate = (formData: { name: string }) => {
    if (!editTenant) return;
    updateMutation.mutate(
      { id: editTenant.id, ...formData },
      { onSuccess: () => setEditTenant(null) }
    );
  };

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title={t("backoffice.tenants.columns.name")} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name}</span>
        ),
        size: 250,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.tenants.columns.name"),
          skeleton: <Skeleton className="h-4 w-40" />,
        },
      },
      {
        accessorKey: "slug",
        id: "slug",
        header: ({ column }) => (
          <DataGridColumnHeader title={t("backoffice.tenants.columns.slug")} column={column} />
        ),
        cell: ({ row }) => (
          <code className="text-sm text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {row.original.slug}
          </code>
        ),
        size: 180,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.tenants.columns.slug"),
          skeleton: <Skeleton className="h-5 w-28" />,
        },
      },
      {
        accessorKey: "usersCount",
        id: "usersCount",
        header: ({ column }) => (
          <DataGridColumnHeader title={t("backoffice.tenants.columns.usersCount")} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.usersCount ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.usersCount"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader title={t("backoffice.tenants.columns.createdAt")} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 140,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.tenants.columns.createdAt"),
          skeleton: <Skeleton className="h-4 w-24" />,
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
              <DropdownMenuItem onClick={() => setEditTenant(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteTenant(row.original)}
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
    [t]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "createdAt",
        label: t("backoffice.tenants.columns.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const tenants = data?.tenants ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("backoffice.tenants.title")}</h1>
        <p className="text-muted-foreground">{t("backoffice.tenants.description")}</p>
      </div>

      <DataTable
        data={tenants}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
      />

      <EditTenantDialog
        tenant={editTenant}
        open={!!editTenant}
        onOpenChange={(open) => !open && setEditTenant(null)}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
      />

      <DeleteDialog
        open={!!deleteTenant}
        onOpenChange={(open) => !open && setDeleteTenant(null)}
        title={t("backoffice.tenants.delete.title")}
        description={t("backoffice.tenants.delete.description", {
          name: deleteTenant?.name,
        })}
        confirmValue={deleteTenant?.name ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
