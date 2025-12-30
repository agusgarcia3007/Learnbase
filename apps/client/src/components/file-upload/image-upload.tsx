import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Progress } from "@/components/ui/progress";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { useDirectUpload } from "@/hooks/use-direct-upload";
import { cn } from "@/lib/utils";
import type { UploadFolder } from "@/services/uploads/service";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onConfirm: (key: string) => Promise<string>;
  onDelete?: () => Promise<void>;
  folder: UploadFolder;
  maxSize?: number;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/1" | "3/2";
  className?: string;
  disabled?: boolean;
  isConfirming?: boolean;
  isDeleting?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onConfirm,
  onDelete,
  folder,
  maxSize = 5 * 1024 * 1024,
  aspectRatio = "16/9",
  className,
  disabled = false,
  isConfirming = false,
  isDeleting = false,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { upload, isUploading, progress } = useDirectUpload({ folder });

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);

        try {
          const { key } = await upload(file);
          const url = await onConfirm(key);
          onChange(url);
        } finally {
          setLocalPreview(null);
          URL.revokeObjectURL(preview);
        }
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
    accept: "image/*",
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

  const aspectRatioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/1": "aspect-[3/1]",
    "3/2": "aspect-[3/2]",
  }[aspectRatio];

  const displayImage = localPreview || value;

  if (displayImage) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border",
            aspectRatioClass
          )}
        >
          <Image
            src={displayImage}
            alt="Uploaded image"
            layout="fullWidth"
            className="h-full w-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
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
