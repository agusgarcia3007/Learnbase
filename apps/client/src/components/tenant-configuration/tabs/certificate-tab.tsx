import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/file-upload/image-upload";
import { CertificatePreviewModal } from "@/components/certificate/certificate-preview-modal";

import { SaveButton } from "../save-button";
import type { ConfigurationFormData } from "../schema";

type CertificateTabProps = {
  signatureUrl: string | null;
  onSignatureChange: (url: string | null) => void;
  onSignatureUpload: (base64: string) => Promise<string>;
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
          <ImageUpload
            value={signatureUrl}
            onChange={onSignatureChange}
            onUpload={onSignatureUpload}
            onDelete={onSignatureDelete}
            aspectRatio="3/2"
            maxSize={1 * 1024 * 1024}
            isUploading={isUploadingSignature}
            isDeleting={isDeletingSignature}
            className="max-w-60"
          />
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
