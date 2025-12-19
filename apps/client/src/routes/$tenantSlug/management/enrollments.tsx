import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Download,
  Ellipsis,
  Eye,
  ListFilter,
  UserPlus,
  XCircle,
  RefreshCw,
} from "lucide-react";
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
import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@learnbase/ui";

import { DataTable } from "@/components/data-table";
import { createSeoMeta } from "@/lib/seo";
import { EnrollDialog } from "@/components/enrollments/enroll-dialog";
import { EnrollmentDetailDialog } from "@/components/enrollments/enrollment-detail-dialog";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useAdminEnrollments,
  useCreateEnrollment,
  useUpdateEnrollmentStatus,
  AdminEnrollmentsService,
  type AdminEnrollment,
  type EnrollmentStatus,
} from "@/services/admin-enrollments";

export const Route = createFileRoute("/$tenantSlug/management/enrollments")({
  head: () =>
    createSeoMeta({
      title: "Enrollments",
      description: "Manage student enrollments",
      noindex: true,
    }),
  component: EnrollmentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
  }),
});

const STATUS_VARIANTS: Record<
  EnrollmentStatus,
  "success" | "info" | "secondary"
> = {
  completed: "success",
  active: "info",
  cancelled: "secondary",
};

function EnrollmentsPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useAdminEnrollments({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{
    enrollment: AdminEnrollment;
    status: "active" | "cancelled";
  } | null>(null);

  const createMutation = useCreateEnrollment();
  const statusMutation = useUpdateEnrollmentStatus();

  const handleEnroll = useCallback(
    (data: { userId: string; courseId: string }) => {
      createMutation.mutate(data, {
        onSuccess: () => setEnrollOpen(false),
      });
    },
    [createMutation]
  );

  const handleStatusChange = useCallback(() => {
    if (!statusAction) return;
    statusMutation.mutate(
      { id: statusAction.enrollment.id, status: statusAction.status },
      { onSuccess: () => setStatusAction(null) }
    );
  }, [statusAction, statusMutation]);

  const handleExportCsv = useCallback(async () => {
    const blob = await AdminEnrollmentsService.exportCsv();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enrollments-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const columns = useMemo<ColumnDef<AdminEnrollment>[]>(
    () => [
      {
        accessorKey: "user",
        id: "user",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.enrollments.columns.user")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage
                src={row.original.user.avatar ?? undefined}
                alt={row.original.user.name}
              />
              <AvatarFallback>
                {row.original.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {row.original.user.name}
              </div>
              <div className="text-muted-foreground text-xs">
                {row.original.user.email}
              </div>
            </div>
          </div>
        ),
        size: 240,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.enrollments.columns.user"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
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
            title={t("dashboard.enrollments.columns.course")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.course.title}</div>
        ),
        size: 200,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.enrollments.columns.course"),
          skeleton: <Skeleton className="h-4 w-32" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.enrollments.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge
            variant={STATUS_VARIANTS[row.original.status]}
            appearance="light"
            size="sm"
          >
            {t(`dashboard.enrollments.statuses.${row.original.status}`)}
          </Badge>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.enrollments.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "progress",
        id: "progress",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.enrollments.columns.progress")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.progress} className="h-2 w-16" />
            <span className="text-xs text-muted-foreground">
              {row.original.progress}%
            </span>
          </div>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.enrollments.columns.progress"),
          skeleton: <Skeleton className="h-2 w-20" />,
        },
      },
      {
        accessorKey: "enrolledAt",
        id: "enrolledAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("dashboard.enrollments.columns.enrolledAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.enrolledAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("dashboard.enrollments.columns.enrolledAt"),
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
              <DropdownMenuItem onClick={() => setDetailId(row.original.id)}>
                <Eye className="size-4" />
                {t("dashboard.enrollments.detail.view")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === "active" && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    setStatusAction({
                      enrollment: row.original,
                      status: "cancelled",
                    })
                  }
                >
                  <XCircle className="size-4" />
                  {t("dashboard.enrollments.cancel.button")}
                </DropdownMenuItem>
              )}
              {row.original.status === "cancelled" && (
                <DropdownMenuItem
                  onClick={() =>
                    setStatusAction({
                      enrollment: row.original,
                      status: "active",
                    })
                  }
                >
                  <RefreshCw className="size-4" />
                  {t("dashboard.enrollments.reactivate.button")}
                </DropdownMenuItem>
              )}
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
        label: t("dashboard.enrollments.filters.status"),
        type: "multiselect",
        icon: <ListFilter className="size-3.5" />,
        options: [
          {
            value: "active",
            label: t("dashboard.enrollments.statuses.active"),
          },
          {
            value: "completed",
            label: t("dashboard.enrollments.statuses.completed"),
          },
          {
            value: "cancelled",
            label: t("dashboard.enrollments.statuses.cancelled"),
          },
        ],
      },
      {
        key: "createdAt",
        label: t("dashboard.enrollments.filters.enrolledAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const enrollments = data?.enrollments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.enrollments.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.enrollments.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" />
            {t("dashboard.enrollments.export.button")}
          </Button>
          <Button onClick={() => setEnrollOpen(true)}>
            <UserPlus className="size-4" />
            {t("dashboard.enrollments.enroll.button")}
          </Button>
        </div>
      </div>

      <DataTable
        data={enrollments}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        emptyState={{
          title: t("dashboard.enrollments.empty.title"),
          description: t("dashboard.enrollments.empty.description"),
          action: (
            <Button onClick={() => setEnrollOpen(true)}>
              <UserPlus className="size-4" />
              {t("dashboard.enrollments.enroll.button")}
            </Button>
          ),
        }}
      />

      <EnrollDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onSubmit={handleEnroll}
        isPending={createMutation.isPending}
      />

      <EnrollmentDetailDialog
        enrollmentId={detailId}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />

      <AlertDialog
        open={!!statusAction}
        onOpenChange={(open) => !open && setStatusAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction?.status === "cancelled"
                ? t("dashboard.enrollments.cancel.title")
                : t("dashboard.enrollments.reactivate.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.status === "cancelled"
                ? t("dashboard.enrollments.cancel.description")
                : t("dashboard.enrollments.reactivate.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={statusMutation.isPending}
              className={
                statusAction?.status === "cancelled"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {statusMutation.isPending
                ? t("common.saving")
                : t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
