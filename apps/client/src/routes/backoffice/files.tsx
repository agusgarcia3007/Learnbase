import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  ChevronRight,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  HardDrive,
  Image,
  Loader2,
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  useBackofficeFiles,
  useBackofficeTenants,
  type BackofficeTenant,
  type FileType,
  type S3File,
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

type NavigationLevel = "tenants" | "folders" | "files";

type FolderType = "videos" | "documents" | "avatars" | "logos" | "certificates";

const FOLDER_CONFIG: Record<
  FolderType,
  { icon: typeof Folder; label: string; types: FileType[] }
> = {
  videos: { icon: Video, label: "Videos", types: ["video"] },
  documents: { icon: FileText, label: "Documents", types: ["document"] },
  avatars: { icon: Image, label: "Avatars", types: ["avatar"] },
  logos: { icon: Image, label: "Logos & Favicons", types: ["logo", "favicon"] },
  certificates: { icon: File, label: "Certificates", types: ["certificate"] },
};

function getFileIcon(type: FileType) {
  switch (type) {
    case "video":
      return Video;
    case "document":
      return FileText;
    case "avatar":
    case "logo":
    case "favicon":
      return Image;
    case "certificate":
      return File;
    default:
      return File;
  }
}

function getFileName(file: S3File): string {
  return (
    file.metadata.title ||
    file.metadata.fileName ||
    file.metadata.userName ||
    file.key.split("/").pop() ||
    "Unknown"
  );
}

function FilesPage() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<NavigationLevel>("tenants");
  const [selectedTenant, setSelectedTenant] = useState<BackofficeTenant | null>(
    null
  );
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [previewFile, setPreviewFile] = useState<S3File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data: tenantsData, isLoading: isLoadingTenants } =
    useBackofficeTenants();

  const { data: filesData, isLoading: isLoadingFiles } = useBackofficeFiles(
    selectedTenant?.id ?? ""
  );

  const filteredFiles = useMemo(() => {
    if (!filesData?.files || !selectedFolder) return [];
    let files = filesData.files.filter((f) =>
      FOLDER_CONFIG[selectedFolder].types.includes(f.type)
    );

    if (tableState.params.search) {
      const search = tableState.params.search.toLowerCase();
      files = files.filter((f) => getFileName(f).toLowerCase().includes(search));
    }

    if (tableState.sortState) {
      const { field, order } = tableState.sortState;
      files = [...files].sort((a, b) => {
        let aVal: string | number | null = null;
        let bVal: string | number | null = null;

        if (field === "createdAt") {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        } else if (field === "size") {
          aVal = a.size ?? 0;
          bVal = b.size ?? 0;
        } else if (field === "name") {
          aVal = getFileName(a).toLowerCase();
          bVal = getFileName(b).toLowerCase();
        } else if (field === "type") {
          aVal = a.type;
          bVal = b.type;
        }

        if (aVal === null || bVal === null) return 0;
        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      });
    }

    return files;
  }, [filesData, selectedFolder, tableState.params.search, tableState.sortState]);

  const paginatedFiles = useMemo(() => {
    const start = (tableState.params.page - 1) * tableState.params.limit;
    return filteredFiles.slice(start, start + tableState.params.limit);
  }, [filteredFiles, tableState.params.page, tableState.params.limit]);

  const columns = useMemo<ColumnDef<S3File>[]>(
    () => [
      {
        accessorKey: "key",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.files.columns.name")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const Icon = getFileIcon(row.original.type);
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{getFileName(row.original)}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                  {row.original.key}
                </p>
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
          <Badge variant="secondary">{row.original.type}</Badge>
        ),
        size: 120,
        enableSorting: true,
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
            {row.original.size ? formatBytes(row.original.size) : "-"}
          </span>
        ),
        size: 100,
        enableSorting: true,
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("backoffice.files.columns.createdAt")}
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
      },
      {
        id: "actions",
        cell: ({ row }) => (
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
    [t]
  );

  const handleSelectTenant = (tenant: BackofficeTenant) => {
    setSelectedTenant(tenant);
    setLevel("folders");
  };

  const handleSelectFolder = (folder: FolderType) => {
    setSelectedFolder(folder);
    setLevel("files");
  };

  const handleNavigateToTenants = () => {
    setLevel("tenants");
    setSelectedTenant(null);
    setSelectedFolder(null);
  };

  const handleNavigateToFolders = () => {
    setLevel("folders");
    setSelectedFolder(null);
  };

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
            <BreadcrumbLink
              onClick={handleNavigateToTenants}
              className="cursor-pointer flex items-center gap-1"
            >
              <HardDrive className="size-4" />
              {t("backoffice.files.allTenants")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {selectedTenant && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {level === "folders" ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    <Building2 className="size-4" />
                    {selectedTenant.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={handleNavigateToFolders}
                    className="cursor-pointer flex items-center gap-1"
                  >
                    <Building2 className="size-4" />
                    {selectedTenant.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}
          {selectedFolder && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {FOLDER_CONFIG[selectedFolder].label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {level === "tenants" && (
        <TenantsList
          tenants={tenantsData?.tenants ?? []}
          isLoading={isLoadingTenants}
          onSelect={handleSelectTenant}
        />
      )}

      {level === "folders" && selectedTenant && (
        <FoldersList
          tenant={selectedTenant}
          filesData={filesData}
          isLoading={isLoadingFiles}
          onSelect={handleSelectFolder}
        />
      )}

      {level === "files" && selectedFolder && (
        <DataTable
          data={paginatedFiles}
          columns={columns}
          pagination={{
            total: filteredFiles.length,
            totalPages: Math.ceil(filteredFiles.length / tableState.params.limit),
          }}
          isLoading={isLoadingFiles}
          tableState={tableState}
          searchPlaceholder={t("backoffice.files.searchPlaceholder")}
          emptyState={{
            icon: <File className="size-12" />,
            title: t("backoffice.files.noFiles"),
          }}
        />
      )}

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

function TenantsList({
  tenants,
  isLoading,
  onSelect,
}: {
  tenants: BackofficeTenant[];
  isLoading: boolean;
  onSelect: (tenant: BackofficeTenant) => void;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t("backoffice.files.noTenants")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tenants.map((tenant) => (
        <Card
          key={tenant.id}
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => onSelect(tenant)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Folder className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">
                  {tenant.name}
                </CardTitle>
                <CardDescription className="truncate">
                  {tenant.slug}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {tenant.usersCount} {t("backoffice.files.users")}
              </span>
              <span>
                {tenant.coursesCount} {t("backoffice.files.courses")}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FoldersList({
  tenant,
  filesData,
  isLoading,
  onSelect,
}: {
  tenant: BackofficeTenant;
  filesData: { files: S3File[]; summary: { byType: Record<string, number> } } | undefined;
  isLoading: boolean;
  onSelect: (folder: FolderType) => void;
}) {
  const { t } = useTranslation();

  const getFolderCount = (folder: FolderType): number => {
    if (!filesData) return 0;
    const types = FOLDER_CONFIG[folder].types;
    return filesData.files.filter((f) => types.includes(f.type)).length;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tenant.name}</CardTitle>
          <CardDescription>
            {t("backoffice.files.selectFolder")}
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(FOLDER_CONFIG) as FolderType[]).map((folder) => {
            const config = FOLDER_CONFIG[folder];
            const count = getFolderCount(folder);
            const Icon = config.icon;

            return (
              <Card
                key={folder}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => onSelect(folder)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <CardDescription>
                        {count} {t("backoffice.files.files")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilePreviewDialog({
  file,
  onClose,
}: {
  file: S3File | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!file) return null;

  const isImage = ["avatar", "logo", "favicon", "certificate"].includes(
    file.type
  );
  const isVideo = file.type === "video";

  return (
    <Dialog open={!!file} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {file.metadata.title ||
              file.metadata.fileName ||
              t("backoffice.files.preview")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isImage && (
            <img
              src={file.url}
              alt={file.metadata.title || "Preview"}
              className="max-h-[60vh] w-full object-contain rounded-lg"
            />
          )}
          {isVideo && (
            <video
              src={file.url}
              controls
              className="max-h-[60vh] w-full rounded-lg"
            />
          )}
          {!isImage && !isVideo && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="size-16 mb-4" />
              <p>{t("backoffice.files.noPreview")}</p>
              <Button asChild className="mt-4">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
