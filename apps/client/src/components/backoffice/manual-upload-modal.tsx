import { FileUp, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import { Input } from "@learnbase/ui";
import { Label } from "@learnbase/ui";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { useUploadBackofficeFile } from "@/services/backoffice-files";

interface ManualUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ManualUploadModal({
  open,
  onOpenChange,
}: ManualUploadModalProps) {
  const { t } = useTranslation();
  const [s3Key, setS3Key] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutate: uploadFile, isPending } = useUploadBackofficeFile();

  const handleFilesAdded = useCallback(
    (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        setSelectedFile(file);
        if (!s3Key) {
          setS3Key(file.name);
        }
      }
    },
    [s3Key]
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
      clearFiles,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    accept: "*",
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const handleUpload = async () => {
    if (!selectedFile || !s3Key.trim()) return;

    const base64 = await fileToBase64(selectedFile);

    uploadFile(
      { base64, key: s3Key.trim() },
      {
        onSuccess: () => {
          toast.success(t("backoffice.files.upload.success"));
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setS3Key("");
    setSelectedFile(null);
    clearFiles();
    onOpenChange(false);
  };

  const isValid = selectedFile && s3Key.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("backoffice.files.upload.title")}</DialogTitle>
          <DialogDescription>
            {t("backoffice.files.upload.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s3-key">
              {t("backoffice.files.upload.keyLabel")}
            </Label>
            <Input
              id="s3-key"
              value={s3Key}
              onChange={(e) => setS3Key(e.target.value)}
              placeholder="marketing/banners/hero.png"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t("backoffice.files.upload.keyHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("backoffice.files.upload.fileLabel")}</Label>
            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileUp className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    clearFiles();
                  }}
                  disabled={isPending}
                >
                  {t("common.remove")}
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed p-8 transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  isPending && "pointer-events-none opacity-50"
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
                  disabled={isPending}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="rounded-full bg-muted p-3">
                    <Upload className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragging
                        ? t("common.dropHere")
                        : t("common.dragOrClick")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("backoffice.files.upload.anyFile")}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {errors.length > 0 && (
              <p className="text-sm text-destructive">{errors[0]}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!isValid}
            isLoading={isPending}
          >
            {t("backoffice.files.upload.uploadButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
