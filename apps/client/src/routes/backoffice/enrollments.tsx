import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Calendar, CheckCircle, Ellipsis, GraduationCap, User } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Progress } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";

import { DataTable } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { createSeoMeta } from "@/lib/seo";
import {
  useGetBackofficeEnrollments,
  type BackofficeEnrollment,
} from "@/services/dashboard";

export const Route = createFileRoute("/backoffice/enrollments")({
  head: () =>
    createSeoMeta({
      title: "Manage Enrollments",
      description: "Manage all LearnBase enrollments",
      noindex: true,
    }),
  component: BackofficeEnrollments,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    tenantId: (search.tenantId as string) || undefined,
    status: (search.status as string) || undefined,
    createdAt: (search.createdAt as string) || undefined,
  }),
});

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-blue-500/10 text-blue-600";
    case "completed":
      return "bg-green-500/10 text-green-600";
    case "cancelled":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-gray-500/10 text-gray-600";
  }
}

function BackofficeEnrollments() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useGetBackofficeEnrollments({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    tenantId: tableState.serverParams.tenantId as string | undefined,
    status: tableState.serverParams.status as "active" | "completed" | "cancelled" | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const columns = useMemo<ColumnDef<BackofficeEnrollment>[]>(
    () => [
      {
        accessorKey: "user",
        id: "user",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.enrollments.columns.user")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <User className="size-4 text-blue-500" />
            </div>
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {row.original.user?.name ?? t("common.unknown")}
              </div>
              {row.original.user?.email && (
                <div className="text-muted-foreground text-xs">
                  {row.original.user.email}
                </div>
              )}
            </div>
          </div>
        ),
        size: 250,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.enrollments.columns.user"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "course",
        id: "course",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.enrollments.columns.course")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
              <GraduationCap className="size-4 text-purple-500" />
            </div>
            <span className="font-medium text-foreground">
              {row.original.course?.title ?? t("common.unknown")}
            </span>
          </div>
        ),
        size: 250,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.enrollments.columns.course"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
          ),
        },
      },
      {
        accessorKey: "tenant",
        id: "tenant",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.enrollments.columns.tenant")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.tenant?.name ?? (
              <span className="text-muted-foreground">
                {t("common.noOrganization")}
              </span>
            )}
          </span>
        ),
        size: 150,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.enrollments.columns.tenant"),
          skeleton: <Skeleton className="h-4 w-28" />,
        },
      },
      {
        accessorKey: "progress",
        id: "progress",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.enrollments.columns.progress")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.progress} className="h-2 w-20" />
            <span className="text-muted-foreground text-sm">
              {row.original.progress}%
            </span>
          </div>
        ),
        size: 140,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.enrollments.columns.progress"),
          skeleton: (
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
          ),
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.enrollments.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(row.original.status)}`}
          >
            {t(`backoffice.enrollments.statuses.${row.original.status}`)}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.enrollments.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.enrollments.columns.enrolledAt")}
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
          headerTitle: t("backoffice.enrollments.columns.enrolledAt"),
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
                onClick={() =>
                  window.open(
                    `/${row.original.tenant?.slug}/students`,
                    "_blank"
                  )
                }
                disabled={!row.original.tenant?.slug}
              >
                {t("backoffice.enrollments.actions.viewInTenant")}
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
        key: "status",
        label: t("backoffice.enrollments.filters.status"),
        type: "multiselect",
        icon: <CheckCircle className="size-3.5" />,
        options: [
          { value: "active", label: t("backoffice.enrollments.statuses.active") },
          { value: "completed", label: t("backoffice.enrollments.statuses.completed") },
          { value: "cancelled", label: t("backoffice.enrollments.statuses.cancelled") },
        ],
      },
      {
        key: "tenantId",
        label: t("backoffice.enrollments.filters.tenant"),
        type: "text",
        icon: <Building2 className="size-3.5" />,
        placeholder: t("backoffice.enrollments.filters.tenantPlaceholder"),
      },
      {
        key: "createdAt",
        label: t("backoffice.enrollments.filters.enrolledAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const enrollments = data?.enrollments ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("backoffice.enrollments.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("backoffice.enrollments.description")}
        </p>
      </div>

      <DataTable
        data={enrollments}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
      />
    </div>
  );
}
