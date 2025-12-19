import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { Eye, ImageIcon, Upload, X, Loader2 } from "lucide-react";

import { Button } from "@learnbase/ui";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@learnbase/ui";
import { Textarea } from "@learnbase/ui";
import { TabsContent } from "@learnbase/ui";
import { Image } from "@learnbase/ui";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import { CertificatePreviewModal } from "@/components/certificate/certificate-preview-modal";

import { SaveButton } from "../save-button";
import type { ConfigurationFormData } from "../schema";

type CertificateTabProps = {
  signatureUrl: string | null;
  onSignatureChange: (url: string | null) => void;
  onSignatureUpload: (file: File) => Promise<string>;
  onSignatureDelete: () => Promise<void>;
  isUploadingSignature: boolean;
  isDeletingSignature: boolean;
  isSaving: boolean;
};

export function CertificateTab({
  signatureUrl,
  onSignatureChange,
  onSignatureUpload,
  onSignatureDelete,
  isUploadingSignature,
  isDeletingSignature,
  isSaving,
}: CertificateTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<ConfigurationFormData>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFilesAdded = useCallback(
    async (files: { file: File | { url: string } }[]) => {
      const file = files[0]?.file;
      if (file instanceof File) {
        const preview = URL.createObjectURL(file);
        setLocalPreview(preview);
        const url = await onSignatureUpload(file);
        onSignatureChange(url);
        setLocalPreview(null);
        URL.revokeObjectURL(preview);
      }
    },
    [onSignatureUpload, onSignatureChange]
  );

  const [
    { isDragging, errors: signatureErrors },
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
    maxSize: 1 * 1024 * 1024,
    accept: "image/*",
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const handleSignatureDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onSignatureDelete();
    onSignatureChange(null);
  };

  const isSignatureLoading = isUploadingSignature || isDeletingSignature;
  const displaySignature = localPreview || signatureUrl;

  return (
    <TabsContent value="certificates" className="space-y-8">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="mr-2 size-4" />
          {t("certificates.preview.button")}
        </Button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <FormItem>
          <FormLabel>
            {t("dashboard.site.configuration.certificates.signatureImage")}
          </FormLabel>
          {displaySignature ? (
            <div className="relative max-w-60">
              <div className="relative aspect-[3/2] overflow-hidden rounded-lg border">
                <Image
                  src={displaySignature}
                  alt="Signature"
                  layout="fullWidth"
                  className="h-full w-full object-cover"
                />
                {isSignatureLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {!isSignatureLoading && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleSignatureDelete}
                  className="absolute -right-2 -top-2 size-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex max-w-60 flex-col gap-2">
              <div
                className={cn(
                  "relative aspect-[3/2] cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  isSignatureLoading && "pointer-events-none opacity-50"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
              >
                <input {...getInputProps()} className="sr-only" disabled={isSignatureLoading} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                  {isSignatureLoading ? (
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
                          {isDragging ? t("common.dropHere") : t("common.dragOrClick")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("common.maxFileSize", { size: formatBytes(1 * 1024 * 1024) })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {signatureErrors.length > 0 && (
                <p className="text-sm text-destructive">{signatureErrors[0]}</p>
              )}
            </div>
          )}
          <FormDescription>
            {t("dashboard.site.configuration.certificates.signatureImageHelp")}
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="signatureTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.certificates.signatureTitle")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.certificates.signatureTitlePlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.certificates.signatureTitleHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="customMessage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.certificates.customMessage")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder={t(
                  "dashboard.site.configuration.certificates.customMessagePlaceholder"
                )}
                className="resize-none"
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.configuration.certificates.customMessageHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <SaveButton isLoading={isSaving} />

      <CertificatePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </TabsContent>
  );
}
