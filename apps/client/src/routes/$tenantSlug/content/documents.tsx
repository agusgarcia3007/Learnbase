import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Ellipsis, FileText, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@learnbase/ui";
import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@learnbase/ui";
import { Textarea } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@learnbase/ui";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@learnbase/ui";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { DocumentUpload } from "@/components/file-upload/document-upload";
import { formatBytes } from "@/hooks/use-file-upload";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useDocumentsList,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useConfirmDocumentFile,
  useDeleteDocumentFile,
  useConfirmDocumentStandalone,
  type Document as DocumentType,
} from "@/services/documents";
import { createSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/$tenantSlug/content/documents")({
  head: () =>
    createSeoMeta({
      title: "Documents",
      description: "Manage your documents",
      noindex: true,
    }),
  component: DocumentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
  }),
});

const documentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type DocumentFormData = z.infer<typeof documentSchema>;

function DocumentsPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useDocumentsList({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentType | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<DocumentType | null>(
    null
  );
  const [pendingFile, setPendingFile] = useState<{
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);

  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();
  const confirmMutation = useConfirmDocumentFile();
  const deleteFileMutation = useDeleteDocumentFile();
  const confirmStandaloneMutation = useConfirmDocumentStandalone();

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (editDocument) {
      form.reset({
        title: editDocument.title,
        description: editDocument.description ?? "",
        status: editDocument.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "draft",
      });
    }
  }, [editDocument, form]);

  const handleOpenCreate = useCallback(() => {
    setEditDocument(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((document: DocumentType) => {
    setEditDocument(document);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(
    (open: boolean) => {
      if (!open) {
        setEditorOpen(false);
        setEditDocument(null);
        setPendingFile(null);
        form.reset();
      }
    },
    [form]
  );

  const handleSubmit = useCallback(
    (values: DocumentFormData) => {
      if (editDocument) {
        updateMutation.mutate(
          { id: editDocument.id, ...values },
          { onSuccess: () => handleCloseEditor(false) }
        );
      } else {
        createMutation.mutate(
          {
            ...values,
            fileKey: pendingFile?.fileKey,
            fileName: pendingFile?.fileName,
            fileSize: pendingFile?.fileSize,
            mimeType: pendingFile?.mimeType,
          },
          {
            onSuccess: () => handleCloseEditor(false),
          }
        );
      }
    },
    [
      editDocument,
      createMutation,
      updateMutation,
      handleCloseEditor,
      pendingFile,
    ]
  );

  const handleDelete = useCallback(() => {
    if (!deleteDocument) return;
    deleteMutation.mutate(deleteDocument.id, {
      onSuccess: () => setDeleteDocument(null),
    });
  }, [deleteDocument, deleteMutation]);

  const handleConfirmFile = useCallback(
    async (data: { key: string; fileName: string; fileSize: number; mimeType: string }) => {
      if (!editDocument) return "";
      const result = await confirmMutation.mutateAsync({
        id: editDocument.id,
        ...data,
      });
      return result.document.fileUrl ?? "";
    },
    [editDocument, confirmMutation]
  );

  const handleDeleteFile = useCallback(async () => {
    if (!editDocument) return;
    await deleteFileMutation.mutateAsync(editDocument.id);
  }, [editDocument, deleteFileMutation]);

  const handleConfirmFileStandalone = useCallback(
    async (data: { key: string; fileName: string; fileSize: number; mimeType: string }) => {
      const result = await confirmStandaloneMutation.mutateAsync(data);
      setPendingFile({
        fileKey: result.fileKey,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
      });
      return result.fileUrl;
    },
    [confirmStandaloneMutation]
  );

  const handleDeletePendingFile = useCallback(async () => {
    setPendingFile(null);
  }, []);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns = useMemo<ColumnDef<DocumentType>[]>(
    () => [
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("documents.columns.title")}
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
          headerTitle: t("documents.columns.title"),
          skeleton: (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          ),
        },
      },
      {
        accessorKey: "fileName",
        id: "fileName",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("documents.columns.fileName")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.fileName || "-"}
          </span>
        ),
        size: 200,
        enableSorting: false,
        meta: {
          headerTitle: t("documents.columns.fileName"),
          skeleton: <Skeleton className="h-4 w-32" />,
        },
      },
      {
        accessorKey: "fileSize",
        id: "fileSize",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("documents.columns.fileSize")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.fileSize ? formatBytes(row.original.fileSize) : "-"}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("documents.columns.fileSize"),
          skeleton: <Skeleton className="h-4 w-16" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("documents.columns.status")}
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
            {t(`documents.statuses.${row.original.status}`)}
          </Badge>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("documents.columns.status"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("documents.columns.createdAt")}
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
          headerTitle: t("documents.columns.createdAt"),
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
              <DropdownMenuItem onClick={() => handleOpenEdit(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteDocument(row.original)}
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
    [t, handleOpenEdit]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "status",
        label: t("documents.filters.status"),
        type: "select",
        icon: <FileText className="size-3.5" />,
        options: [
          { label: t("documents.statuses.draft"), value: "draft" },
          { label: t("documents.statuses.published"), value: "published" },
        ],
      },
      {
        key: "createdAt",
        label: t("documents.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const documents = data?.documents ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("documents.title")}</h1>
          <p className="text-muted-foreground">{t("documents.description")}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("documents.create.button")}
        </Button>
      </div>

      <DataTable
        data={documents}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        emptyState={{
          title: t("documents.empty.title"),
          description: t("documents.empty.description"),
          action: (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              {t("documents.create.button")}
            </Button>
          ),
        }}
      />

      <Dialog open={editorOpen} onOpenChange={handleCloseEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editDocument
                ? t("documents.edit.title")
                : t("documents.create.title")}
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
                    <FormLabel>{t("documents.form.title")}</FormLabel>
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
                    <FormLabel>{t("documents.form.description")}</FormLabel>
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
                    <FormLabel>{t("documents.form.status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">
                          {t("documents.statuses.draft")}
                        </SelectItem>
                        <SelectItem value="published">
                          {t("documents.statuses.published")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>{t("documents.form.file")}</FormLabel>
                <DocumentUpload
                  value={
                    editDocument
                      ? editDocument.fileUrl
                      : pendingFile?.fileUrl ?? null
                  }
                  fileName={
                    editDocument
                      ? editDocument.fileName
                      : pendingFile?.fileName ?? null
                  }
                  fileSize={
                    editDocument
                      ? editDocument.fileSize
                      : pendingFile?.fileSize ?? null
                  }
                  mimeType={
                    editDocument
                      ? editDocument.mimeType
                      : pendingFile?.mimeType ?? null
                  }
                  onChange={() => {}}
                  onConfirm={
                    editDocument ? handleConfirmFile : handleConfirmFileStandalone
                  }
                  onDelete={
                    editDocument ? handleDeleteFile : handleDeletePendingFile
                  }
                  folder="documents"
                  isConfirming={
                    editDocument
                      ? confirmMutation.isPending
                      : confirmStandaloneMutation.isPending
                  }
                  isDeleting={deleteFileMutation.isPending}
                />
              </FormItem>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseEditor(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {editDocument ? t("common.save") : t("common.create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteDocument}
        onOpenChange={(open) => !open && setDeleteDocument(null)}
        title={t("documents.delete.title")}
        description={t("documents.delete.description", {
          name: deleteDocument?.title,
        })}
        confirmValue={deleteDocument?.title ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
