import { Button } from "@learnbase/ui";
import { Progress } from "@/components/ui/progress";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { useDirectUpload } from "@/hooks/use-direct-upload";
import { cn } from "@/lib/utils";
import type { UploadFolder } from "@/services/uploads/service";
import { Loader2, Upload, Video, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

interface VideoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onConfirm: (data: { key: string; duration: number; fileSizeBytes: number }) => Promise<string>;
  onDelete?: () => Promise<void>;
  folder: UploadFolder;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  isConfirming?: boolean;
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
  onConfirm,
  onDelete,
  folder,
  maxSize = 500 * 1024 * 1024,
  className,
  disabled = false,
  isConfirming = false,
  isDeleting = false,
}: VideoUploadProps) {
  const { t } = useTranslation();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { upload, isUploading, progress } = useDirectUpload({ folder });

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);

        const [{ key }, duration] = await Promise.all([
          upload(file),
          getVideoDuration(file),
        ]);

        const url = await onConfirm({ key, duration, fileSizeBytes: file.size });
        onChange(url);
        setLocalPreview(null);
        URL.revokeObjectURL(preview);
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
    accept: "video/mp4,video/webm,video/quicktime",
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

  const displayVideo = localPreview || value;

  if (displayVideo) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative overflow-hidden rounded-lg border aspect-video">
          <video
            src={displayVideo}
            controls={!isLoading}
            className="h-full w-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              {isUploading && (
                <div className="w-40">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {t("common.uploading")} {progress}%
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
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              {isUploading && (
                <div className="w-40">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {t("common.uploading")} {progress}%
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
