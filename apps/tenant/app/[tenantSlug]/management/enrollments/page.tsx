"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  DotsThree,
  Eye,
  XCircle,
  ArrowCounterClockwise,
  GraduationCap,
  SpinnerGap,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAdminEnrollments,
  useAdminUpdateEnrollmentStatus,
  type AdminEnrollment,
  type EnrollmentStatus,
} from "@/services/enrollments";

const STATUS_VARIANTS: Record<EnrollmentStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  cancelled: "outline",
};

export default function EnrollmentsPage() {
  const { t } = useTranslation();
  const [statusAction, setStatusAction] = useState<{
    enrollment: AdminEnrollment;
    status: "active" | "cancelled";
  } | null>(null);

  const { data, isLoading } = useAdminEnrollments();
  const statusMutation = useAdminUpdateEnrollmentStatus();

  const handleStatusChange = () => {
    if (!statusAction) return;
    statusMutation.mutate(
      { id: statusAction.enrollment.id, status: statusAction.status },
      { onSuccess: () => setStatusAction(null) }
    );
  };

  const enrollments = data?.enrollments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("enrollmentsList.title")}</h1>
          <p className="text-muted-foreground">{t("enrollmentsList.description")}</p>
        </div>
      </div>

      {isLoading ? (
        <EnrollmentsTableSkeleton />
      ) : enrollments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("enrollmentsList.columns.user")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("enrollmentsList.columns.course")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("enrollmentsList.columns.status")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("enrollmentsList.columns.progress")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("enrollmentsList.columns.enrolledAt")}
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                        {enrollment.user.avatar ? (
                          <img
                            src={enrollment.user.avatar}
                            alt={enrollment.user.name}
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {enrollment.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{enrollment.user.name}</div>
                        <div className="text-xs text-muted-foreground">{enrollment.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{enrollment.course.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[enrollment.status]}>
                      {t(`enrollmentsList.statuses.${enrollment.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                        <DotsThree className="size-5" weight="bold" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {enrollment.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => setStatusAction({ enrollment, status: "cancelled" })}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 size-4" />
                            {t("enrollmentsList.cancel.button")}
                          </DropdownMenuItem>
                        )}
                        {enrollment.status === "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => setStatusAction({ enrollment, status: "active" })}
                          >
                            <ArrowCounterClockwise className="mr-2 size-4" />
                            {t("enrollmentsList.reactivate.button")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction?.status === "cancelled"
                ? t("enrollmentsList.cancel.title")
                : t("enrollmentsList.reactivate.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.status === "cancelled"
                ? t("enrollmentsList.cancel.description")
                : t("enrollmentsList.reactivate.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              className={
                statusAction?.status === "cancelled"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {statusMutation.isPending && (
                <SpinnerGap className="mr-2 size-4 animate-spin" />
              )}
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <GraduationCap className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{t("enrollmentsList.empty.title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("enrollmentsList.empty.description")}
      </p>
    </div>
  );
}

function EnrollmentsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
              <td className="px-4 py-3"><Skeleton className="h-2 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="size-8" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
