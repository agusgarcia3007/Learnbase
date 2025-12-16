import { PricingOverlay } from "@/components/pricing-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { formatBytes } from "@/lib/format";
import { createSeoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useCreatePortalSession,
  useCreateSubscription,
  useEarnings,
  usePayments,
  usePlans,
  useSubscription,
  useExportPayments,
} from "@/services/billing";
import type {
  EarningsResponse,
  Payment,
  PaymentStatus,
  SubscriptionResponse,
  TenantPlan,
} from "@/services/billing/service";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  HardDrive,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$tenantSlug/billing")({
  head: () =>
    createSeoMeta({
      title: "Billing",
      description: "Manage your subscription",
      noindex: true,
    }),
  component: BillingPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
    paidAt: (search.paidAt as string) || undefined,
  }),
});

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const isNegative =
    status === "past_due" || status === "canceled" || status === "unpaid";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        isNegative
          ? "border-destructive/50 text-destructive"
          : "border-primary/50 text-primary"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          isNegative ? "bg-destructive" : "bg-primary"
        )}
      />
      {t(`billing.status.${status}`)}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();

  const variants: Record<PaymentStatus, "success" | "warning" | "destructive" | "secondary"> = {
    succeeded: "success",
    pending: "warning",
    processing: "warning",
    failed: "destructive",
    refunded: "secondary",
  };

  return (
    <Badge variant={variants[status]} appearance="outline" size="sm">
      {t(`billing.paymentStatus.${status}`)}
    </Badge>
  );
}

function StorageCard({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const { t } = useTranslation();
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t("billing.usage.storage")}
        </CardTitle>
        <HardDrive className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatBytes(used)}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}/ {formatBytes(limit)}
          </span>
        </div>
        <Progress
          value={percentage}
          className="mt-3 h-2"
          aria-label={t("billing.usage.progress", {
            percentage: Math.round(percentage),
          })}
        />
      </CardContent>
    </Card>
  );
}

function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function EarningsCards({ earnings }: { earnings: EarningsResponse }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("billing.earnings.gross")}
          </CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(earnings.grossEarnings)}
          </div>
          <p className="text-xs text-muted-foreground">
            {earnings.transactionCount} {t("billing.earnings.transactions")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("billing.earnings.net")}
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(earnings.netEarnings)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("billing.earnings.afterFees")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CurrentPlanCard({
  subscription,
  onManageBilling,
  onChangePlan,
  isLoading,
}: {
  subscription: SubscriptionResponse;
  onManageBilling: () => void;
  onChangePlan: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="size-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">
                {subscription.plan
                  ? t(`billing.plans.${subscription.plan}`)
                  : t("billing.noPlan")}
              </span>
              {subscription.subscriptionStatus && (
                <div className="mt-1">
                  <StatusBadge status={subscription.subscriptionStatus} />
                </div>
              )}
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 gap-2" onClick={onChangePlan}>
            {t("billing.changePlan")}
            <ArrowRight className="size-4" />
          </Button>
          {subscription.stripeCustomerId && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={onManageBilling}
              isLoading={isLoading}
            >
              <ExternalLink className="size-4" />
              {t("billing.manageBilling")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentsTable() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "paidAt", order: "desc" },
  });

  const { data, isLoading } = usePayments({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    paidAt: tableState.serverParams.paidAt as string | undefined,
  });

  const exportMutation = useExportPayments();

  const handleExport = (format: "csv" | "xlsx") => {
    const filters = {
      format,
      status: tableState.serverParams.status as string | undefined,
      paidAt: tableState.serverParams.paidAt as string | undefined,
    };

    exportMutation.mutate(filters, {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payments-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "paidAt",
        id: "paidAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("billing.payments.columns.date")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.paidAt
              ? new Date(row.original.paidAt).toLocaleDateString()
              : "-"}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("billing.payments.columns.date"),
          skeleton: <Skeleton className="h-4 w-24" />,
        },
      },
      {
        accessorKey: "userName",
        id: "userName",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("billing.payments.columns.customer")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="space-y-px">
            <div className="font-medium">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.userEmail}
            </div>
          </div>
        ),
        size: 220,
        enableSorting: false,
        meta: {
          headerTitle: t("billing.payments.columns.customer"),
          skeleton: (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          ),
        },
      },
      {
        accessorKey: "courses",
        id: "courses",
        header: () => t("billing.payments.columns.courses"),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm text-muted-foreground">
            {row.original.courses.map((c) => c.title).join(", ") || "-"}
          </div>
        ),
        size: 200,
        enableSorting: false,
        meta: {
          headerTitle: t("billing.payments.columns.courses"),
          skeleton: <Skeleton className="h-4 w-32" />,
        },
      },
      {
        accessorKey: "amount",
        id: "amount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("billing.payments.columns.amount")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("billing.payments.columns.amount"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        accessorKey: "netAmount",
        id: "netAmount",
        header: () => t("billing.payments.columns.net"),
        cell: ({ row }) => (
          <span className="text-green-600 font-medium">
            {formatCurrency(row.original.netAmount, row.original.currency)}
          </span>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("billing.payments.columns.net"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: () => t("billing.payments.columns.status"),
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("billing.payments.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
    ],
    [t]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "status",
        label: t("billing.payments.filters.status"),
        type: "multiselect",
        options: [
          { value: "succeeded", label: t("billing.paymentStatus.succeeded") },
          { value: "pending", label: t("billing.paymentStatus.pending") },
          { value: "failed", label: t("billing.paymentStatus.failed") },
          { value: "refunded", label: t("billing.paymentStatus.refunded") },
        ],
      },
      {
        key: "paidAt",
        label: t("billing.payments.filters.date"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const payments = data?.payments ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("billing.payments.title")}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" isLoading={exportMutation.isPending}>
              <Download className="size-4" />
              {t("billing.payments.export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="size-4" />
              {t("billing.payments.exportCsv")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("xlsx")}>
              <FileSpreadsheet className="size-4" />
              {t("billing.payments.exportXlsx")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        data={payments}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        getRowId={(row) => row.id}
      />
    </div>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-3 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function BillingContent({
  subscription,
  earnings,
  onManageBilling,
  onChangePlan,
  isLoadingPortal,
}: {
  subscription: SubscriptionResponse;
  earnings: EarningsResponse | undefined;
  onManageBilling: () => void;
  onChangePlan: () => void;
  isLoadingPortal: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.description")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StorageCard
          used={subscription.storageUsedBytes}
          limit={subscription.storageLimitBytes}
        />
        {earnings && <EarningsCards earnings={earnings} />}
      </div>

      <CurrentPlanCard
        subscription={subscription}
        onManageBilling={onManageBilling}
        onChangePlan={onChangePlan}
        isLoading={isLoadingPortal}
      />

      <PaymentsTable />
    </div>
  );
}

function BillingPage() {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { data: subscription, isLoading: isLoadingSubscription } =
    useSubscription();
  const { data: plansData, isLoading: isLoadingPlans } = usePlans();
  const { data: earnings } = useEarnings();
  const { mutate: createSubscription, isPending: isCreating } =
    useCreateSubscription();
  const { mutate: createPortal, isPending: isOpeningPortal } =
    useCreatePortalSession();

  const handleSelectPlan = (plan: TenantPlan) => {
    createSubscription(plan, {
      onSuccess: (data) => {
        window.location.href = data.checkoutUrl;
      },
    });
  };

  const handleManageBilling = () => {
    createPortal(undefined, {
      onSuccess: (data) => {
        window.location.href = data.portalUrl;
      },
    });
  };

  if (isLoadingSubscription || isLoadingPlans) {
    return <BillingPageSkeleton />;
  }

  const hasSubscription = subscription?.hasSubscription ?? false;
  const showOverlay = !hasSubscription || showPricingModal;
  const canClose = hasSubscription && showPricingModal;
  const plans = plansData?.plans ?? [];

  return (
    <>
      <BillingContent
        subscription={subscription!}
        earnings={earnings}
        onManageBilling={handleManageBilling}
        onChangePlan={() => setShowPricingModal(true)}
        isLoadingPortal={isOpeningPortal}
      />

      {showOverlay && (
        <PricingOverlay
          plans={plans}
          onSelectPlan={handleSelectPlan}
          isLoading={isCreating}
          canClose={canClose}
          onClose={() => setShowPricingModal(false)}
        />
      )}
    </>
  );
}
