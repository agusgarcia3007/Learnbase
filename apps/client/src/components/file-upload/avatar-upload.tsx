import { Button } from "@learnbase/ui";
import { Image } from "@learnbase/ui";
import { Progress } from "@learnbase/ui";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { useDirectUpload } from "@/hooks/use-direct-upload";
import { cn } from "@/lib/utils";
import { useDeleteAvatar, useConfirmAvatar } from "@/services/profile/mutations";
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

export default function AvatarUpload({
  currentAvatar,
  userName,
  maxSize = 2 * 1024 * 1024,
  className,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const { upload, isUploading, progress } = useDirectUpload({ folder: "avatars" });
  const { mutateAsync: confirmAvatar, isPending: isConfirming } = useConfirmAvatar();
  const { mutate: deleteAvatar, isPending: isDeleting } = useDeleteAvatar();

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const { key } = await upload(file);
        await confirmAvatar(key);
      }
    },
    [upload, confirmAvatar]
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              {isUploading && (
                <span className="text-xs text-muted-foreground">{progress}%</span>
              )}
            </div>
          ) : currentAvatar ? (
            <Image
              src={currentAvatar}
              alt="Avatar"
              layout="fixed"
              width={96}
              height={96}
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
        {isUploading && (
          <div className="mt-2 w-24">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <p className="text-sm text-destructive">{errors[0]}</p>
      )}
    </div>
  );
}
