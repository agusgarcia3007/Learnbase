import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronRight,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  HardDrive,
  Image,
  Upload,
  Video,
} from "lucide-react";

import { DataTable } from "@/components/data-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { formatBytes } from "@/lib/format";
import {
  useBrowseBackofficeFiles,
  type BrowseItem,
} from "@/services/backoffice-files";
import { ManualUploadModal } from "@/components/backoffice/manual-upload-modal";

export const Route = createFileRoute("/backoffice/files")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
  }),
  component: FilesPage,
});

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return File;

  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return Video;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext))
    return Image;
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "vtt", "srt"].includes(ext))
    return FileText;
  return File;
}

function isImageFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext);
}

function isVideoFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && ["mp4", "webm", "mov", "avi", "mkv"].includes(ext);
}

function FilesPage() {
  const { t } = useTranslation();
  const [prefix, setPrefix] = useState("");
  const [previewFile, setPreviewFile] = useState<BrowseItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const tableState = useDataTableState({
    defaultSort: { field: "name", order: "asc" },
  });

  const { data, isLoading } = useBrowseBackofficeFiles(prefix);

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = [...data.items];

    if (tableState.params.search) {
      const search = tableState.params.search.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      if (tableState.sortState) {
        const { field, order } = tableState.sortState;
        let aVal: string | number | null = null;
        let bVal: string | number | null = null;

        if (field === "name") {
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
        } else if (field === "size") {
          aVal = a.size ?? 0;
          bVal = b.size ?? 0;
        } else if (field === "lastModified") {
          aVal = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          bVal = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        }

        if (aVal !== null && bVal !== null) {
          if (aVal < bVal) return order === "asc" ? -1 : 1;
          if (aVal > bVal) return order === "asc" ? 1 : -1;
        }
      }

      return a.name.localeCompare(b.name);
    });

    return items;
  }, [data, tableState.params.search, tableState.sortState]);

  const paginatedItems = useMemo(() => {
    const start = (tableState.params.page - 1) * tableState.params.limit;
    return filteredItems.slice(start, start + tableState.params.limit);
  }, [filteredItems, tableState.params.page, tableState.params.limit]);

  const breadcrumbParts = useMemo(() => {
    if (!prefix) return [];
    return prefix.split("/").filter(Boolean);
  }, [prefix]);

  const handleNavigate = (item: BrowseItem) => {
    if (item.type === "folder") {
      setPrefix(item.path);
      tableState.setParams({ page: 1 });
    } else {
      setPreviewFile(item);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setPrefix("");
    } else {
      const newPrefix = breadcrumbParts.slice(0, index + 1).join("/") + "/";
      setPrefix(newPrefix);
    }
    tableState.setParams({ page: 1 });
  };

  const columns = useMemo<ColumnDef<BrowseItem>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.files.columns.name")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const Icon =
            item.type === "folder" ? Folder : getFileIcon(item.name);
          return (
            <div
              className="flex cursor-pointer items-center gap-3"
              onClick={() => handleNavigate(item)}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${
                  item.type === "folder" ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <Icon
                  className={`size-5 ${
                    item.type === "folder"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                {item.type === "file" && (
                  <p className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {item.path}
                  </p>
                )}
              </div>
            </div>
          );
        },
        size: 350,
        enableSorting: true,
      },
      {
        accessorKey: "type",
        id: "type",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.files.columns.type")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.type === "folder"
              ? t("backoffice.files.folder")
              : t("backoffice.files.file")}
          </Badge>
        ),
        size: 120,
        enableSorting: false,
      },
      {
        accessorKey: "size",
        id: "size",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.files.columns.size")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.type === "file" && row.original.size
              ? formatBytes(row.original.size)
              : "-"}
          </span>
        ),
        size: 100,
        enableSorting: true,
      },
      {
        accessorKey: "lastModified",
        id: "lastModified",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.files.modified")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.lastModified
              ? new Date(row.original.lastModified).toLocaleDateString()
              : "-"}
          </span>
        ),
        size: 120,
        enableSorting: true,
      },
      {
        id: "actions",
        cell: ({ row }) =>
          row.original.type === "file" && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewFile(row.original)}
              >
                <Eye className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={row.original.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" />
                </a>
              </Button>
            </div>
          ),
        size: 100,
      },
    ],
    [t, handleNavigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("backoffice.files.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("backoffice.files.description")}
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          <Upload className="mr-2 size-4" />
          {t("backoffice.files.upload.button")}
        </Button>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {breadcrumbParts.length === 0 ? (
              <BreadcrumbPage className="flex items-center gap-1">
                <HardDrive className="size-4" />
                {t("backoffice.files.root")}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                onClick={() => handleBreadcrumbClick(-1)}
                className="flex cursor-pointer items-center gap-1"
              >
                <HardDrive className="size-4" />
                {t("backoffice.files.root")}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {breadcrumbParts.map((part, index) => (
            <div key={part} className="flex items-center">
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {index === breadcrumbParts.length - 1 ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    <Folder className="size-4" />
                    {part}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => handleBreadcrumbClick(index)}
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <Folder className="size-4" />
                    {part}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <DataTable
        data={paginatedItems}
        columns={columns}
        pagination={{
          total: filteredItems.length,
          totalPages: Math.ceil(
            filteredItems.length / tableState.params.limit
          ),
        }}
        isLoading={isLoading}
        tableState={tableState}
        searchPlaceholder={t("backoffice.files.searchPlaceholder")}
        emptyState={{
          icon: <File className="size-12" />,
          title: t("backoffice.files.noFiles"),
        }}
      />

      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <ManualUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
    </div>
  );
}

function FilePreviewDialog({
  file,
  onClose,
}: {
  file: BrowseItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!file || file.type !== "file") return null;

  const isImage = isImageFile(file.name);
  const isVideo = isVideoFile(file.name);

  return (
    <Dialog open={!!file} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isImage && file.url && (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
          )}
          {isVideo && file.url && (
            <video
              src={file.url}
              controls
              className="max-h-[60vh] w-full rounded-lg"
            />
          )}
          {!isImage && !isVideo && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-4 size-16" />
              <p>{t("backoffice.files.noPreview")}</p>
              <Button asChild className="mt-4">
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 size-4" />
                  {t("backoffice.files.download")}
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
