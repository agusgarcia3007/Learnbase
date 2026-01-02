import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle,
  Download,
  Ellipsis,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { createSeoMeta } from "@/lib/seo";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useGetTenantUsers,
  useDeleteTenantUser,
  useUpdateTenantUser,
  useInviteUser,
  useBulkDeleteTenantUsers,
  useBulkUpdateRole,
  UsersService,
} from "@/services/users";
import type { TenantUser, UserRole } from "@/services/users/service";

export const Route = createFileRoute("/$tenantSlug/management/users")({
  head: () =>
    createSeoMeta({
      title: "Users",
      description: "Manage your users",
      noindex: true,
    }),
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
  const [editUser, setEditUser] = useState<TenantUser | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false);
  const [bulkRoleValue, setBulkRoleValue] = useState<"admin" | "student">("student");

  const deleteMutation = useDeleteTenantUser();
  const updateMutation = useUpdateTenantUser();
  const inviteMutation = useInviteUser();
  const bulkDeleteMutation = useBulkDeleteTenantUsers();
  const bulkRoleMutation = useBulkUpdateRole();

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;

  const handleDelete = useCallback(() => {
    if (!deleteUser) return;
    deleteMutation.mutate(deleteUser.id, {
      onSuccess: () => setDeleteUser(null),
    });
  }, [deleteUser, deleteMutation]);

  const handleEdit = useCallback(
    (data: { name: string; role: "admin" | "student" }) => {
      if (!editUser) return;
      updateMutation.mutate(
        { id: editUser.id, ...data },
        { onSuccess: () => setEditUser(null) }
      );
    },
    [editUser, updateMutation]
  );

  const handleInvite = useCallback(
    (data: { email: string; name: string; role: "admin" | "student" }) => {
      inviteMutation.mutate(data, {
        onSuccess: () => setInviteOpen(false),
      });
    },
    [inviteMutation]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setRowSelection({});
      },
    });
  }, [selectedIds, bulkDeleteMutation]);

  const handleBulkRole = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkRoleMutation.mutate(
      { ids: selectedIds, role: bulkRoleValue },
      {
        onSuccess: () => {
          setBulkRoleOpen(false);
          setRowSelection({});
        },
      }
    );
  }, [selectedIds, bulkRoleValue, bulkRoleMutation]);

  const handleExportCsv = useCallback(async () => {
    const blob = await UsersService.exportTenantUsersCsv();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

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
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => {
          if (row.original.role === "owner") return null;
          return <DataGridTableRowSelect row={row} />;
        },
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
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
        accessorKey: "enrollmentsCount",
        id: "enrollmentsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.enrolled")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="outline" size="sm">
            {row.original.enrollmentsCount}
          </Badge>
        ),
        size: 90,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.users.columns.enrolled"),
          skeleton: <Skeleton className="h-5 w-8" />,
        },
      },
      {
        accessorKey: "completedCount",
        id: "completedCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.completed")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="success" appearance="outline" size="sm">
            {row.original.completedCount}
          </Badge>
        ),
        size: 90,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.users.columns.completed"),
          skeleton: <Skeleton className="h-5 w-8" />,
        },
      },
      {
        accessorKey: "lastActivity",
        id: "lastActivity",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.lastActivity")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.lastActivity
              ? formatDistanceToNow(new Date(row.original.lastActivity), {
                  addSuffix: true,
                })
              : "-"}
          </span>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.users.columns.lastActivity"),
          skeleton: <Skeleton className="h-4 w-16" />,
        },
      },
      {
        accessorKey: "emailVerified",
        id: "emailVerified",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.users.columns.verified")}
            column={column}
          />
        ),
        cell: ({ row }) =>
          row.original.emailVerified ? (
            <CheckCircle className="size-4 text-success" />
          ) : (
            <XCircle className="size-4 text-muted-foreground" />
          ),
        size: 80,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.users.columns.verified"),
          skeleton: <Skeleton className="size-4" />,
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
        cell: ({ row }) => {
          if (row.original.role === "owner") return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="size-7" mode="icon" variant="ghost">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem onClick={() => setEditUser(row.original)}>
                  <Pencil className="size-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteUser(row.original)}
                >
                  <Trash2 className="size-4" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, getRoleBadge]
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.users.title")}</h1>
          <p className="text-muted-foreground">
            {t("dashboard.users.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" />
            {t("dashboard.users.export.button")}
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            {t("dashboard.users.invite.button")}
          </Button>
        </div>
      </div>

      <DataTable
        data={users}
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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Shield className="size-4" />
                    {t("dashboard.users.bulkRole.button")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setBulkRoleValue("admin");
                      setBulkRoleOpen(true);
                    }}
                  >
                    {t("roles.admin")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setBulkRoleValue("student");
                      setBulkRoleOpen(true);
                    }}
                  >
                    {t("roles.student")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                {t("dashboard.users.bulkDelete.button", { count: selectedCount })}
              </Button>
            </div>
          )
        }
      />

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={handleInvite}
        isPending={inviteMutation.isPending}
      />

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSubmit={handleEdit}
        isPending={updateMutation.isPending}
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dashboard.users.bulkDelete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.users.bulkDelete.description", {
                count: selectedCount,
              })}
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

      <AlertDialog open={bulkRoleOpen} onOpenChange={setBulkRoleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dashboard.users.bulkRole.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.users.bulkRole.description", {
                count: selectedCount,
                role: t(`roles.${bulkRoleValue}`),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkRoleMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRole}
              disabled={bulkRoleMutation.isPending}
            >
              {bulkRoleMutation.isPending
                ? t("common.saving")
                : t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
