import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Ellipsis, Calendar, ExternalLink } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { EditTenantDialog } from "@/components/backoffice/edit-tenant-dialog";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { createSeoMeta } from "@/lib/seo";
import {
  useGetTenantsList,
  useDeleteTenant,
  useUpdateTenant,
} from "@/services/tenants";
import type { Tenant } from "@/services/tenants/service";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function parseStorageLimit(maxStorageBytes: string | null): number | null {
  if (!maxStorageBytes) return null;
  const match = maxStorageBytes.match(/^(\d+(?:\.\d+)?)\s*(GB|MB|KB|TB|B)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return value * (multipliers[unit] || 1);
}

export const Route = createFileRoute("/backoffice/tenants")({
  head: () =>
    createSeoMeta({
      title: "Manage Tenants",
      description: "Manage all LearnBase tenants",
      noindex: true,
    }),
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

  const updateMutation = useUpdateTenant(editTenant?.slug ?? "");
  const deleteMutation = useDeleteTenant();

  const handleDelete = () => {
    if (!deleteTenant) return;
    deleteMutation.mutate(deleteTenant.id, {
      onSuccess: () => setDeleteTenant(null),
    });
  };

  const handleUpdate = (formData: {
    name: string;
    status: "active" | "suspended" | "cancelled";
    maxUsers: number | null;
    maxCourses: number | null;
    maxStorageBytes: string | null;
    features: {
      analytics?: boolean;
      certificates?: boolean;
      customDomain?: boolean;
      aiAnalysis?: boolean;
      whiteLabel?: boolean;
    } | null;
  }) => {
    if (!editTenant) return;
    updateMutation.mutate(
      {
        id: editTenant.id,
        name: formData.name,
        status: formData.status,
        maxUsers: formData.maxUsers,
        maxCourses: formData.maxCourses,
        maxStorageBytes: formData.maxStorageBytes,
        features: formData.features,
      },
      { onSuccess: () => setEditTenant(null) }
    );
  };

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.name")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
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
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.slug")}
            column={column}
          />
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
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.usersCount")}
            column={column}
          />
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
        accessorKey: "coursesCount",
        id: "coursesCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.coursesCount")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.coursesCount ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.coursesCount"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "videosCount",
        id: "videosCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.videosCount")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.videosCount ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.videosCount"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "quizzesCount",
        id: "quizzesCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.quizzesCount")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.quizzesCount ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.quizzesCount"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "documentsCount",
        id: "documentsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.documentsCount")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.documentsCount ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.documentsCount"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "storageUsedBytes",
        id: "storageUsedBytes",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.storage")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const used = row.original.storageUsedBytes ?? 0;
          const limit = parseStorageLimit(row.original.maxStorageBytes);
          const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
          return (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                {formatBytes(used)}{limit ? ` / ${formatBytes(limit)}` : ""}
              </span>
              {limit && (
                <Progress value={percentage} className="h-1.5 w-16" />
              )}
            </div>
          );
        },
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.storage"),
          skeleton: <Skeleton className="h-4 w-16" />,
        },
      },
      {
        accessorKey: "activeUsers30d",
        id: "activeUsers30d",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.activeUsers30d")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.activeUsers30d ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.activeUsers30d"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "totalSessions30d",
        id: "totalSessions30d",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.sessions30d")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.totalSessions30d ?? 0}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.sessions30d"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "active"
              ? "primary"
              : status === "suspended"
              ? "secondary"
              : "destructive";
          return (
            <Badge variant={variant as "primary" | "secondary" | "destructive"}>
              {t(`backoffice.tenants.status.${status}`)}
            </Badge>
          );
        },
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.tenants.columns.status"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.tenants.columns.createdAt")}
            column={column}
          />
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
              <DropdownMenuItem asChild>
                <Link
                  to="/$tenantSlug"
                  params={{ tenantSlug: row.original.slug }}
                >
                  <ExternalLink className="size-4" />
                  {t("common.adminDashboard")}
                </Link>
              </DropdownMenuItem>
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
        <p className="text-muted-foreground">
          {t("backoffice.tenants.description")}
        </p>
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
