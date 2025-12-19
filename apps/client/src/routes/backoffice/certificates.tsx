import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Award, Building2, Calendar, Copy, Ellipsis, ExternalLink } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@learnbase/ui";

import { DataTable } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { createSeoMeta } from "@/lib/seo";
import {
  useGetBackofficeCertificates,
  type BackofficeCertificate,
} from "@/services/dashboard";

export const Route = createFileRoute("/backoffice/certificates")({
  head: () =>
    createSeoMeta({
      title: "Manage Certificates",
      description: "Manage all LearnBase certificates",
      noindex: true,
    }),
  component: BackofficeCertificates,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    tenantId: (search.tenantId as string) || undefined,
    issuedAt: (search.issuedAt as string) || undefined,
  }),
});

function BackofficeCertificates() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "issuedAt", order: "desc" },
  });

  const { data, isLoading } = useGetBackofficeCertificates({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    tenantId: tableState.serverParams.tenantId as string | undefined,
    issuedAt: tableState.serverParams.issuedAt as string | undefined,
  });

  const handleCopyCode = useCallback(
    (code: string) => {
      navigator.clipboard.writeText(code);
      toast.success(t("backoffice.certificates.actions.codeCopied"));
    },
    [t]
  );

  const columns = useMemo<ColumnDef<BackofficeCertificate>[]>(
    () => [
      {
        accessorKey: "userName",
        id: "userName",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.certificates.columns.userName")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Award className="size-4 text-amber-500" />
            </div>
            <span className="font-medium text-foreground">
              {row.original.userName}
            </span>
          </div>
        ),
        size: 220,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.certificates.columns.userName"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
          ),
        },
      },
      {
        accessorKey: "courseName",
        id: "courseName",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.certificates.columns.courseName")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.courseName}</span>
        ),
        size: 250,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.certificates.columns.courseName"),
          skeleton: <Skeleton className="h-4 w-40" />,
        },
      },
      {
        accessorKey: "tenant",
        id: "tenant",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.certificates.columns.tenant")}
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
          headerTitle: t("backoffice.certificates.columns.tenant"),
          skeleton: <Skeleton className="h-4 w-28" />,
        },
      },
      {
        accessorKey: "verificationCode",
        id: "verificationCode",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.certificates.columns.verificationCode")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
              {row.original.verificationCode}
            </code>
            <Button
              variant="ghost"
              mode="icon"
              className="size-6"
              onClick={() => handleCopyCode(row.original.verificationCode)}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        ),
        size: 180,
        enableSorting: false,
        meta: {
          headerTitle: t("backoffice.certificates.columns.verificationCode"),
          skeleton: <Skeleton className="h-6 w-28" />,
        },
      },
      {
        accessorKey: "issuedAt",
        id: "issuedAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.certificates.columns.issuedAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.issuedAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.certificates.columns.issuedAt"),
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
                    `/verify/${row.original.verificationCode}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="size-4" />
                {t("backoffice.certificates.actions.verifyCertificate")}
              </DropdownMenuItem>
              {row.original.imageUrl && (
                <DropdownMenuItem
                  onClick={() => window.open(row.original.imageUrl!, "_blank")}
                >
                  <ExternalLink className="size-4" />
                  {t("backoffice.certificates.actions.viewImage")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `/${row.original.tenant?.slug}/students`,
                    "_blank"
                  )
                }
                disabled={!row.original.tenant?.slug}
              >
                {t("backoffice.certificates.actions.viewInTenant")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, handleCopyCode]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "tenantId",
        label: t("backoffice.certificates.filters.tenant"),
        type: "text",
        icon: <Building2 className="size-3.5" />,
        placeholder: t("backoffice.certificates.filters.tenantPlaceholder"),
      },
      {
        key: "issuedAt",
        label: t("backoffice.certificates.filters.issuedAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const certificates = data?.certificates ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("backoffice.certificates.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("backoffice.certificates.description")}
        </p>
      </div>

      <DataTable
        data={certificates}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
      />
    </div>
  );
}
