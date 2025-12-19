import { Button } from "@learnbase/ui";
import { Progress } from "@learnbase/ui";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { useDirectUpload } from "@/hooks/use-direct-upload";
import { cn } from "@/lib/utils";
import type { UploadFolder } from "@/services/uploads/service";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

type FileMetadata = {
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

interface DocumentUploadProps {
  value?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  onChange: (url: string | null) => void;
  onConfirm: (data: FileMetadata) => Promise<string>;
  onDelete?: () => Promise<void>;
  folder?: UploadFolder;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  isConfirming?: boolean;
  isDeleting?: boolean;
}

function getFileIcon(_mimeType: string | null | undefined) {
  return FileText;
}

function getFileExtension(mimeType: string | null | undefined): string {
  const extensions: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  };
  return extensions[mimeType || ""] || "FILE";
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
].join(",");

export function DocumentUpload({
  value,
  fileName,
  fileSize,
  mimeType,
  onChange,
  onConfirm,
  onDelete,
  folder = "documents",
  maxSize = 50 * 1024 * 1024,
  className,
  disabled = false,
  isConfirming = false,
  isDeleting = false,
}: DocumentUploadProps) {
  const { t } = useTranslation();
  const [localFile, setLocalFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const { upload, isUploading, progress } = useDirectUpload({ folder });

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        setLocalFile({ name: file.name, size: file.size, type: file.type });

        const { key, fileName: name, fileSize: size, mimeType: type } = await upload(file);
        const url = await onConfirm({ key, fileName: name, fileSize: size, mimeType: type });
        onChange(url);
        setLocalFile(null);
      }
    },
    [upload, onConfirm, onChange]
  );

  const [
    { isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept: ACCEPTED_TYPES,
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const isLoading = isUploading || isConfirming || isDeleting;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete();
    }
    onChange(null);
  };

  const FileIcon = getFileIcon(mimeType);

  const displayFile = localFile || (value ? { name: fileName, size: fileSize, type: mimeType } : null);

  if (displayFile) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative overflow-hidden rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <FileIcon className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{displayFile.name || t("lessons.file.unknown")}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getFileExtension(displayFile.type)}</span>
                {displayFile.size && (
                  <>
                    <span>-</span>
                    <span>{formatBytes(displayFile.size)}</span>
                  </>
                )}
              </div>
            </div>
            {value && !isLoading && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                asChild
              >
                <a href={value} target="_blank" rel="noopener noreferrer">
                  {t("common.view")}
                </a>
              </Button>
            )}
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              {isUploading && (
                <div className="w-32">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {!disabled && !isLoading && value && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            className="absolute -right-2 -top-2 size-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors p-8",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || isLoading) && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          {...getInputProps()}
          className="sr-only"
          disabled={disabled || isLoading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              {isUploading && (
                <div className="w-32">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                {isDragging ? (
                  <Upload className="size-6 text-primary" />
                ) : (
                  <FileText className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging
                    ? t("common.dropHere")
                    : t("common.dragOrClick")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("lessons.file.formats", { size: formatBytes(maxSize) })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <p className="text-sm text-destructive">{errors[0]}</p>
      )}
    </div>
  );
}
