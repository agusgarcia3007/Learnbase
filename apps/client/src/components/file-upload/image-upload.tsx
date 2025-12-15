import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: () => Promise<void>;
  maxSize?: number;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/1" | "3/2";
  className?: string;
  disabled?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  maxSize = 5 * 1024 * 1024,
  aspectRatio = "16/9",
  className,
  disabled = false,
  isUploading = false,
  isDeleting = false,
}: ImageUploadProps) {
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
    accept: "image/*",
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

  const aspectRatioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/1": "aspect-[3/1]",
    "3/2": "aspect-[3/2]",
  }[aspectRatio];

  if (value) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border",
            aspectRatioClass
          )}
        >
          <Image
            src={value}
            alt="Uploaded image"
            layout="fullWidth"
            className="h-full w-full object-cover"
          />
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
          "relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectRatioClass,
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

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          {isLoading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                {isDragging ? (
                  <Upload className="size-6 text-primary" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging
                    ? t("common.dropHere")
                    : t("common.dragOrClick")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("common.maxFileSize", { size: formatBytes(maxSize) })}
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
