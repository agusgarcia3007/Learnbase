import { Button } from "@/components/ui/button";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { Loader2, Upload, Video, X } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface VideoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onUpload: (data: { file: File; duration: number }) => Promise<string>;
  onDelete?: () => Promise<void>;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  maxSize = 100 * 1024 * 1024,
  className,
  disabled = false,
  isUploading = false,
  isDeleting = false,
}: VideoUploadProps) {
  const { t } = useTranslation();

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const duration = await getVideoDuration(file);
        const url = await onUpload({ file, duration });
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
    accept: "video/mp4,video/webm,video/quicktime",
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

  if (value) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative overflow-hidden rounded-lg border aspect-video">
          <video
            src={value}
            controls
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
          "relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors aspect-video",
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
                  <Video className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging
                    ? t("common.dropHere")
                    : t("common.dragOrClick")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("common.videoFormats", { size: formatBytes(maxSize) })}
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
