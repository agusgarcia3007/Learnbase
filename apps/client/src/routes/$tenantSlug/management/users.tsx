import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Ellipsis, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useDeleteUser, useGetTenantUsers } from "@/services/users";
import { tenantUsersListOptions } from "@/services/users/options";
import type { TenantUser, UserRole } from "@/services/users/service";

export const Route = createFileRoute("/$tenantSlug/management/users")({
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(tenantUsersListOptions({ page: 1, limit: 10 }));
  },
  component: TenantUsersPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    role: (search.role as string) || undefined,
  }),
});

function TenantUsersPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useGetTenantUsers({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    role: tableState.serverParams.role as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [deleteUser, setDeleteUser] = useState<TenantUser | null>(null);

  const deleteMutation = useDeleteUser();

  const handleDelete = () => {
    if (!deleteUser) return;
    deleteMutation.mutate(deleteUser.id, {
      onSuccess: () => setDeleteUser(null),
    });
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<
      UserRole,
      "primary" | "success" | "warning" | "info"
    > = {
      superadmin: "primary",
      owner: "success",
      admin: "warning",
      student: "info",
    };
    return (
      <Badge variant={variants[role]} appearance="outline" size="sm">
        {t(`roles.${role}`)}
      </Badge>
    );
  };

  const columns = useMemo<ColumnDef<TenantUser>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.name")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage
                src={row.original.avatar ?? undefined}
                alt={row.original.name}
              />
              <AvatarFallback>
                {row.original.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {row.original.name}
              </div>
              <div className="text-muted-foreground text-xs">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
        size: 280,
        enableSorting: true,
        meta: {
          headerTitle: t("dashboard.users.columns.name"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "role",
        id: "role",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.role")}
            column={column}
          />
        ),
        cell: ({ row }) => getRoleBadge(row.original.role),
        size: 140,
        enableSorting: true,
        meta: {
          headerTitle: t("dashboard.users.columns.role"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.createdAt")}
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
          headerTitle: t("dashboard.users.columns.createdAt"),
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
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteUser(row.original)}
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
        key: "role",
        label: t("dashboard.users.filters.role"),
        type: "multiselect",
        icon: <Shield className="size-3.5" />,
        options: [
          { value: "owner", label: t("roles.owner") },
          { value: "admin", label: t("roles.admin") },
          { value: "student", label: t("roles.student") },
        ],
      },
      {
        key: "createdAt",
        label: t("dashboard.users.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.users.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.users.description")}
        </p>
      </div>

      <DataTable
        data={users}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
      />

      <DeleteDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title={t("dashboard.users.delete.title")}
        description={t("dashboard.users.delete.description", {
          name: deleteUser?.name,
        })}
        confirmValue={deleteUser?.name ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
