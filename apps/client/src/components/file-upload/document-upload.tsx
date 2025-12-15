import { Button } from "@/components/ui/button";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface DocumentUploadProps {
  value?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: () => Promise<void>;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  isUploading?: boolean;
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
  onUpload,
  onDelete,
  maxSize = 50 * 1024 * 1024,
  className,
  disabled = false,
  isUploading = false,
  isDeleting = false,
}: DocumentUploadProps) {
  const { t } = useTranslation();

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const url = await onUpload(file);
        onChange(url);
      }
    },
    [onUpload, onChange]
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

  const isLoading = isUploading || isDeleting;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete();
    }
    onChange(null);
  };

  const FileIcon = getFileIcon(mimeType);

  if (value) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative overflow-hidden rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <FileIcon className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{fileName || t("lessons.file.unknown")}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getFileExtension(mimeType)}</span>
                {fileSize && (
                  <>
                    <span>-</span>
                    <span>{formatBytes(fileSize)}</span>
                  </>
                )}
              </div>
            </div>
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
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {!disabled && !isLoading && (
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
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
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
