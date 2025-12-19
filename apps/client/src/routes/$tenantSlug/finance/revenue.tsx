import { Badge } from "@learnbase/ui";
import { Button } from "@learnbase/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import { DataTable } from "@/components/data-table";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { createSeoMeta } from "@/lib/seo";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useEarnings,
  usePayments,
  useExportPayments,
} from "@/services/revenue";
import type {
  EarningsResponse,
  Payment,
  PaymentStatus,
} from "@/services/revenue/service";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$tenantSlug/finance/revenue")({
  head: () =>
    createSeoMeta({
      title: "Revenue",
      description: "View your earnings and payment history",
      noindex: true,
    }),
  component: RevenuePage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
    paidAt: (search.paidAt as string) || undefined,
  }),
});

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
      {t(`revenue.paymentStatus.${status}`)}
    </Badge>
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
            {t("revenue.earnings.gross")}
          </CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(earnings.grossEarnings)}
          </div>
          <p className="text-xs text-muted-foreground">
            {earnings.transactionCount} {t("revenue.earnings.transactions")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("revenue.earnings.net")}
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(earnings.netEarnings)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("revenue.earnings.afterFees")}
          </p>
        </CardContent>
      </Card>
    </div>
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
            title={t("revenue.payments.columns.date")}
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
          headerTitle: t("revenue.payments.columns.date"),
          skeleton: <Skeleton className="h-4 w-24" />,
        },
      },
      {
        accessorKey: "userName",
        id: "userName",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("revenue.payments.columns.customer")}
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
          headerTitle: t("revenue.payments.columns.customer"),
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
        header: () => t("revenue.payments.columns.courses"),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm text-muted-foreground">
            {row.original.courses.map((c) => c.title).join(", ") || "-"}
          </div>
        ),
        size: 200,
        enableSorting: false,
        meta: {
          headerTitle: t("revenue.payments.columns.courses"),
          skeleton: <Skeleton className="h-4 w-32" />,
        },
      },
      {
        accessorKey: "amount",
        id: "amount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("revenue.payments.columns.amount")}
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
          headerTitle: t("revenue.payments.columns.amount"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        accessorKey: "netAmount",
        id: "netAmount",
        header: () => t("revenue.payments.columns.net"),
        cell: ({ row }) => (
          <span className="text-green-600 font-medium">
            {formatCurrency(row.original.netAmount, row.original.currency)}
          </span>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("revenue.payments.columns.net"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: () => t("revenue.payments.columns.status"),
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("revenue.payments.columns.status"),
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
        label: t("revenue.payments.filters.status"),
        type: "multiselect",
        options: [
          { value: "succeeded", label: t("revenue.paymentStatus.succeeded") },
          { value: "pending", label: t("revenue.paymentStatus.pending") },
          { value: "failed", label: t("revenue.paymentStatus.failed") },
          { value: "refunded", label: t("revenue.paymentStatus.refunded") },
        ],
      },
      {
        key: "paidAt",
        label: t("revenue.payments.filters.date"),
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
        <h2 className="text-lg font-semibold">{t("revenue.payments.title")}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" isLoading={exportMutation.isPending}>
              <Download className="size-4" />
              {t("revenue.payments.export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileSpreadsheet className="size-4" />
              {t("revenue.payments.exportCsv")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("xlsx")}>
              <FileSpreadsheet className="size-4" />
              {t("revenue.payments.exportXlsx")}
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

function RevenuePageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
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

function RevenuePage() {
  const { t } = useTranslation();
  const { data: earnings, isLoading: isLoadingEarnings } = useEarnings();

  if (isLoadingEarnings) {
    return <RevenuePageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("revenue.title")}</h1>
          <p className="text-muted-foreground">{t("revenue.description")}</p>
        </div>
      </div>

      {earnings && <EarningsCards earnings={earnings} />}

      <PaymentsTable />
    </div>
  );
}
