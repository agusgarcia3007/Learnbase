import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Mail, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";

import { useDataTableState } from "@/hooks/use-data-table-state";
import { createSeoMeta } from "@/lib/seo";
import {
  useGetBackofficeWaitlist,
  useDeleteWaitlist,
  type BackofficeWaitlistEntry,
} from "@/services/dashboard";

export const Route = createFileRoute("/backoffice/waitlist")({
  head: () =>
    createSeoMeta({
      title: "Waitlist",
      description: "Manage LearnBase waitlist",
      noindex: true,
    }),
  component: BackofficeWaitlist,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    createdAt: (search.createdAt as string) || undefined,
  }),
});

function BackofficeWaitlist() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useGetBackofficeWaitlist({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [deleteEntry, setDeleteEntry] = useState<BackofficeWaitlistEntry | null>(null);
  const deleteMutation = useDeleteWaitlist();

  const handleDelete = () => {
    if (!deleteEntry) return;
    deleteMutation.mutate(deleteEntry.id, {
      onSuccess: () => setDeleteEntry(null),
    });
  };

  const columns = useMemo<ColumnDef<BackofficeWaitlistEntry>[]>(
    () => [
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.waitlist.columns.email")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Mail className="size-4 text-blue-500" />
            </div>
            <span className="font-medium text-foreground">
              {row.original.email}
            </span>
          </div>
        ),
        size: 350,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.waitlist.columns.email"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-48" />
            </div>
          ),
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.waitlist.columns.createdAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 150,
        enableSorting: true,
        meta: {
          headerTitle: t("backoffice.waitlist.columns.createdAt"),
          skeleton: <Skeleton className="h-4 w-24" />,
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            className="size-7"
            mode="icon"
            variant="ghost"
            onClick={() => setDeleteEntry(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
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
        label: t("backoffice.waitlist.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const waitlist = data?.waitlist ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("backoffice.waitlist.title")}</h1>
        <p className="text-muted-foreground">
          {t("backoffice.waitlist.description")}
        </p>
      </div>

      <DataTable
        data={waitlist}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
      />

      <DeleteDialog
        open={!!deleteEntry}
        onOpenChange={(open) => !open && setDeleteEntry(null)}
        title={t("backoffice.waitlist.delete.title")}
        description={t("backoffice.waitlist.delete.description", {
          email: deleteEntry?.email,
        })}
        confirmValue={deleteEntry?.email ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
