import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  Ellipsis,
  ExternalLink,
  History,
  Percent,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@learnbase/ui";
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

import { ChangePlanDialog } from "@/components/backoffice/change-plan-dialog";
import { CancelSubscriptionDialog } from "@/components/backoffice/cancel-subscription-dialog";
import { ExtendTrialDialog } from "@/components/backoffice/extend-trial-dialog";
import { SubscriptionHistoryDialog } from "@/components/backoffice/subscription-history-dialog";
import { UpdateCommissionDialog } from "@/components/backoffice/update-commission-dialog";
import { DataTable } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { createSeoMeta } from "@/lib/seo";
import {
  useBackofficeSubscriptions,
  type BackofficeSubscription,
} from "@/services/backoffice-subscriptions";

export const Route = createFileRoute("/backoffice/subscriptions")({
  head: () =>
    createSeoMeta({
      title: "Manage Subscriptions",
      description: "Manage all tenant subscriptions",
      noindex: true,
    }),
  component: BackofficeSubscriptions,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    plan: (search.plan as string) || undefined,
    status: (search.status as string) || undefined,
    createdAt: (search.createdAt as string) || undefined,
  }),
});

function getPlanColor(plan: string | null): string {
  switch (plan) {
    case "starter":
      return "bg-slate-500/10 text-slate-600";
    case "growth":
      return "bg-blue-500/10 text-blue-600";
    case "scale":
      return "bg-purple-500/10 text-purple-600";
    default:
      return "bg-gray-500/10 text-gray-600";
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case "trialing":
      return "bg-blue-500/10 text-blue-600";
    case "active":
      return "bg-green-500/10 text-green-600";
    case "past_due":
      return "bg-orange-500/10 text-orange-600";
    case "canceled":
      return "bg-red-500/10 text-red-600";
    case "unpaid":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-gray-500/10 text-gray-600";
  }
}

function getConnectStatusIcon(status: string | null): React.ReactNode {
  switch (status) {
    case "active":
      return <CheckCircle className="size-4 text-green-500" />;
    case "pending":
      return <RefreshCw className="size-4 text-orange-500" />;
    case "restricted":
      return <XCircle className="size-4 text-red-500" />;
    default:
      return <XCircle className="size-4 text-gray-400" />;
  }
}

function BackofficeSubscriptions() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const [changePlanSubscription, setChangePlanSubscription] = useState<BackofficeSubscription | null>(null);
  const [cancelSubscription, setCancelSubscription] = useState<BackofficeSubscription | null>(null);
  const [extendTrialSubscription, setExtendTrialSubscription] = useState<BackofficeSubscription | null>(null);
  const [historySubscription, setHistorySubscription] = useState<BackofficeSubscription | null>(null);
  const [commissionSubscription, setCommissionSubscription] = useState<BackofficeSubscription | null>(null);

  const { data, isLoading } = useBackofficeSubscriptions({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    plan: tableState.serverParams.plan as string | undefined,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const columns = useMemo<ColumnDef<BackofficeSubscription>[]>(
    () => [
      {
        accessorKey: "tenant",
        id: "tenant",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.tenant")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Building2 className="size-4 text-blue-500" />
            </div>
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {row.original.tenantName}
              </div>
              <div className="text-muted-foreground text-xs">
                {row.original.tenantSlug}
              </div>
            </div>
          </div>
        ),
        size: 220,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.tenant"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "plan",
        id: "plan",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.plan")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPlanColor(row.original.plan)}`}
          >
            {row.original.plan
              ? t(`backoffice.subscriptions.plans.${row.original.plan}`)
              : t("backoffice.subscriptions.noPlan")}
          </span>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.plan"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "subscriptionStatus",
        id: "subscriptionStatus",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(row.original.subscriptionStatus)}`}
          >
            {row.original.subscriptionStatus
              ? t(`backoffice.subscriptions.statuses.${row.original.subscriptionStatus}`)
              : t("backoffice.subscriptions.noSubscription")}
          </span>
        ),
        size: 110,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "trialEndsAt",
        id: "trialEndsAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.trialEnds")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.trialEndsAt
              ? new Date(row.original.trialEndsAt).toLocaleDateString()
              : "-"}
          </span>
        ),
        size: 110,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.trialEnds"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        accessorKey: "commissionRate",
        id: "commissionRate",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.commission")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-medium">
            {row.original.commissionRate}%
          </span>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.commission"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "stripeConnectStatus",
        id: "stripeConnectStatus",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.connectStatus")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getConnectStatusIcon(row.original.stripeConnectStatus)}
            <span className="text-muted-foreground text-xs">
              {row.original.stripeConnectStatus
                ? t(`backoffice.subscriptions.connectStatuses.${row.original.stripeConnectStatus}`)
                : t("backoffice.subscriptions.connectStatuses.not_started")}
            </span>
          </div>
        ),
        size: 130,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.connectStatus"),
          skeleton: (
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ),
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.subscriptions.columns.createdAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 110,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.subscriptions.columns.createdAt"),
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
              <DropdownMenuItem onClick={() => setHistorySubscription(row.original)}>
                <History className="mr-2 size-4" />
                {t("backoffice.subscriptions.actions.viewHistory")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setChangePlanSubscription(row.original)}
                disabled={!row.original.stripeSubscriptionId}
              >
                <CreditCard className="mr-2 size-4" />
                {t("backoffice.subscriptions.actions.changePlan")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setExtendTrialSubscription(row.original)}
                disabled={row.original.subscriptionStatus !== "trialing"}
              >
                <RefreshCw className="mr-2 size-4" />
                {t("backoffice.subscriptions.actions.extendTrial")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCommissionSubscription(row.original)}>
                <Percent className="mr-2 size-4" />
                {t("backoffice.subscriptions.actions.updateCommission")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCancelSubscription(row.original)}
                disabled={!row.original.stripeSubscriptionId || row.original.subscriptionStatus === "canceled"}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 size-4" />
                {t("backoffice.subscriptions.actions.cancelSubscription")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `https://dashboard.stripe.com/customers/${row.original.stripeCustomerId}`,
                    "_blank"
                  )
                }
                disabled={!row.original.stripeCustomerId}
              >
                <ExternalLink className="mr-2 size-4" />
                {t("backoffice.subscriptions.actions.viewInStripe")}
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
        key: "plan",
        label: t("backoffice.subscriptions.filters.plan"),
        type: "multiselect",
        icon: <Zap className="size-3.5" />,
        options: [
          { value: "starter", label: t("backoffice.subscriptions.plans.starter") },
          { value: "growth", label: t("backoffice.subscriptions.plans.growth") },
          { value: "scale", label: t("backoffice.subscriptions.plans.scale") },
        ],
      },
      {
        key: "status",
        label: t("backoffice.subscriptions.filters.status"),
        type: "multiselect",
        icon: <CheckCircle className="size-3.5" />,
        options: [
          { value: "trialing", label: t("backoffice.subscriptions.statuses.trialing") },
          { value: "active", label: t("backoffice.subscriptions.statuses.active") },
          { value: "past_due", label: t("backoffice.subscriptions.statuses.past_due") },
          { value: "canceled", label: t("backoffice.subscriptions.statuses.canceled") },
          { value: "unpaid", label: t("backoffice.subscriptions.statuses.unpaid") },
        ],
      },
      {
        key: "createdAt",
        label: t("backoffice.subscriptions.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const subscriptions = data?.subscriptions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("backoffice.subscriptions.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("backoffice.subscriptions.description")}
        </p>
      </div>

      <DataTable
        data={subscriptions}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
      />

      <ChangePlanDialog
        subscription={changePlanSubscription}
        open={!!changePlanSubscription}
        onOpenChange={(open) => !open && setChangePlanSubscription(null)}
      />

      <CancelSubscriptionDialog
        subscription={cancelSubscription}
        open={!!cancelSubscription}
        onOpenChange={(open) => !open && setCancelSubscription(null)}
      />

      <ExtendTrialDialog
        subscription={extendTrialSubscription}
        open={!!extendTrialSubscription}
        onOpenChange={(open) => !open && setExtendTrialSubscription(null)}
      />

      <SubscriptionHistoryDialog
        subscription={historySubscription}
        open={!!historySubscription}
        onOpenChange={(open) => !open && setHistorySubscription(null)}
      />

      <UpdateCommissionDialog
        subscription={commissionSubscription}
        open={!!commissionSubscription}
        onOpenChange={(open) => !open && setCommissionSubscription(null)}
      />
    </div>
  );
}
