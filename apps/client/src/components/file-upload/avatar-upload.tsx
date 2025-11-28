import { Button } from "@/components/ui/button";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { useDeleteAvatar, useUploadAvatar } from "@/services/profile/mutations";
import { Loader2, X } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName?: string;
  maxSize?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AvatarUpload({
  currentAvatar,
  userName,
  maxSize = 2 * 1024 * 1024,
  className,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const { mutate: deleteAvatar, isPending: isDeleting } = useDeleteAvatar();

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const base64 = await fileToBase64(file);
        uploadAvatar(base64);
      }
    },
    [uploadAvatar]
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
  const initials = userName ? getInitials(userName) : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAvatar();
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "relative size-24 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            currentAvatar && "border-solid border-transparent",
            isLoading && "pointer-events-none opacity-50"
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
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-xl font-medium text-muted-foreground">
                {initials || "?"}
              </span>
            </div>
          )}
        </div>

        {currentAvatar && !isLoading && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            className="absolute -end-1 bg-destructive/10 text-destructive -top-1 size-6 rounded-full"
            aria-label={t("profile.removeAvatar")}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t("profile.uploadAvatar")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("profile.avatarHint", { size: formatBytes(maxSize) })}
        </p>
      </div>

      {errors.length > 0 && (
        <p className="text-sm text-destructive">{errors[0]}</p>
      )}
    </div>
  );
}
