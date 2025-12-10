import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import {
  Calendar,
  Ellipsis,
  ListChecks,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useQuizzesList,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useBulkDeleteQuizzes,
  type Quiz,
} from "@/services/quizzes";

export const Route = createFileRoute("/$tenantSlug/content/quizzes/")({
  component: QuizzesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
  }),
});

const quizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type QuizFormData = z.infer<typeof quizSchema>;

function QuizzesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = Route.useParams();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useQuizzesList({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();
  const deleteMutation = useDeleteQuiz();
  const bulkDeleteMutation = useBulkDeleteQuizzes();

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id]
  );
  const selectedCount = selectedIds.length;

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (editQuiz) {
      form.reset({
        title: editQuiz.title,
        description: editQuiz.description ?? "",
        status: editQuiz.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "draft",
      });
    }
  }, [editQuiz, form]);

  const handleOpenCreate = useCallback(() => {
    setEditQuiz(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((quiz: Quiz) => {
    setEditQuiz(quiz);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(
    (open: boolean) => {
      if (!open) {
        setEditorOpen(false);
        setEditQuiz(null);
        form.reset();
      }
    },
    [form]
  );

  const handleSubmit = useCallback(
    (values: QuizFormData) => {
      if (editQuiz) {
        updateMutation.mutate(
          { id: editQuiz.id, ...values },
          { onSuccess: () => handleCloseEditor(false) }
        );
      } else {
        createMutation.mutate(values, {
          onSuccess: () => handleCloseEditor(false),
        });
      }
    },
    [editQuiz, createMutation, updateMutation, handleCloseEditor]
  );

  const handleDelete = useCallback(() => {
    if (!deleteQuiz) return;
    deleteMutation.mutate(deleteQuiz.id, {
      onSuccess: () => setDeleteQuiz(null),
    });
  }, [deleteQuiz, deleteMutation]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setRowSelection({});
      },
    });
  }, [selectedIds, bulkDeleteMutation]);

  const handleManageQuestions = useCallback(
    (quiz: Quiz) => {
      navigate({
        to: "/$tenantSlug/content/quizzes/$quizId",
        params: { tenantSlug, quizId: quiz.id },
      });
    },
    [navigate, tenantSlug]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns = useMemo<ColumnDef<Quiz>[]>(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("quizzes.columns.title")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="space-y-px">
            <div className="font-medium text-foreground">
              {row.original.title}
            </div>
            {row.original.description && (
              <div className="text-muted-foreground text-xs line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
        size: 300,
        enableSorting: true,
        meta: {
          headerTitle: t("quizzes.columns.title"),
          skeleton: (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          ),
        },
      },
      {
        accessorKey: "questionCount",
        id: "questionCount",
        header: t("quizzes.columns.questions"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.questionCount}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("quizzes.columns.questions"),
          skeleton: <Skeleton className="h-4 w-8" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("quizzes.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "published" ? "success" : "secondary"
            }
            size="sm"
          >
            {t(`quizzes.statuses.${row.original.status}`)}
          </Badge>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("quizzes.columns.status"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("quizzes.columns.createdAt")}
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
          headerTitle: t("quizzes.columns.createdAt"),
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
              <DropdownMenuItem
                onClick={() => handleManageQuestions(row.original)}
              >
                <Settings2 className="size-4" />
                {t("quizzes.manageQuestions")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteQuiz(row.original)}
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
    [t, handleOpenEdit, handleManageQuestions]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "status",
        label: t("quizzes.filters.status"),
        type: "select",
        icon: <ListChecks className="size-3.5" />,
        options: [
          { label: t("quizzes.statuses.draft"), value: "draft" },
          { label: t("quizzes.statuses.published"), value: "published" },
        ],
      },
      {
        key: "createdAt",
        label: t("quizzes.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const quizzes = data?.quizzes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("quizzes.title")}</h1>
          <p className="text-muted-foreground">{t("quizzes.description")}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("quizzes.create.button")}
        </Button>
      </div>

      <DataTable
        data={quizzes}
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
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("quizzes.bulkDelete.button", { count: selectedCount })}
            </Button>
          )
        }
        emptyState={{
          title: t("quizzes.empty.title"),
          description: t("quizzes.empty.description"),
          action: (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              {t("quizzes.create.button")}
            </Button>
          ),
        }}
      />

      <Dialog open={editorOpen} onOpenChange={handleCloseEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editQuiz ? t("quizzes.edit.title") : t("quizzes.create.title")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quizzes.form.title")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quizzes.form.description")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quizzes.form.status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">
                          {t("quizzes.statuses.draft")}
                        </SelectItem>
                        <SelectItem value="published">
                          {t("quizzes.statuses.published")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseEditor(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {editQuiz ? t("common.save") : t("common.create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteQuiz}
        onOpenChange={(open) => !open && setDeleteQuiz(null)}
        title={t("quizzes.delete.title")}
        description={t("quizzes.delete.description", {
          name: deleteQuiz?.title,
        })}
        confirmValue={deleteQuiz?.title ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("quizzes.bulkDelete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("quizzes.bulkDelete.description", { count: selectedCount })}
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
    </div>
  );
}
