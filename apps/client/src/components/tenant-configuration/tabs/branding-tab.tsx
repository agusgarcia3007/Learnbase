import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/file-upload/image-upload";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";

import { ThemeSelector } from "../theme-selector";
import { PatternSelector } from "../pattern-selector";
import { SaveButton } from "../save-button";
import type { ConfigurationFormData } from "../schema";

type BrandingTabProps = {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  onLogoUpload: (base64: string) => Promise<string>;
  onLogoDelete: () => Promise<void>;
  isUploadingLogo: boolean;
  isDeletingLogo: boolean;
  faviconUrl: string | null;
  onFaviconChange: (url: string | null) => void;
  onFaviconUpload: (base64: string) => Promise<string>;
  onFaviconDelete: () => Promise<void>;
  isUploadingFavicon: boolean;
  isDeletingFavicon: boolean;
  isSlugChanged: boolean;
  isSaving: boolean;
};

export function BrandingTab({
  logoUrl,
  onLogoChange,
  onLogoUpload,
  onLogoDelete,
  isUploadingLogo,
  isDeletingLogo,
  faviconUrl,
  onFaviconChange,
  onFaviconUpload,
  onFaviconDelete,
  isUploadingFavicon,
  isDeletingFavicon,
  isSlugChanged,
  isSaving,
}: BrandingTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<ConfigurationFormData>();

  return (
    <TabsContent value="branding" className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.branding.slug")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.branding.slugPlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.branding.slugHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.branding.name")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.branding.namePlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.branding.nameHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {isSlugChanged && (
        <Alert variant="warning" appearance="light">
          <AlertIcon>
            <AlertTriangle />
          </AlertIcon>
          <AlertDescription>
            {t("dashboard.site.configuration.branding.slugWarning")}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        <FormItem>
          <FormLabel>
            {t("dashboard.site.configuration.branding.logo")}
          </FormLabel>
          <ImageUpload
            value={logoUrl}
            onChange={onLogoChange}
            onUpload={onLogoUpload}
            onDelete={onLogoDelete}
            aspectRatio="1/1"
            maxSize={2 * 1024 * 1024}
            isUploading={isUploadingLogo}
            isDeleting={isDeletingLogo}
            className="max-w-40"
          />
          <FormDescription>
            {t("dashboard.site.configuration.branding.logoHelp")}
          </FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>
            {t("dashboard.site.configuration.branding.favicon")}
          </FormLabel>
          <ImageUpload
            value={faviconUrl}
            onChange={onFaviconChange}
            onUpload={onFaviconUpload}
            onDelete={onFaviconDelete}
            aspectRatio="1/1"
            maxSize={512 * 1024}
            isUploading={isUploadingFavicon}
            isDeleting={isDeletingFavicon}
            className="max-w-24"
          />
          <FormDescription>
            {t("dashboard.site.configuration.branding.faviconHelp")}
          </FormDescription>
        </FormItem>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.branding.theme")}
              </FormLabel>
              <FormControl>
                <ThemeSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.branding.themeHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="heroPattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.customization.heroPattern")}
              </FormLabel>
              <FormControl>
                <PatternSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.heroPatternHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coursesPagePattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.customization.coursesPagePattern")}
              </FormLabel>
              <FormControl>
                <PatternSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.coursesPagePatternHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="showHeaderName"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {t("dashboard.site.configuration.branding.showHeaderName")}
              </FormLabel>
              <FormDescription>
                {t("dashboard.site.configuration.branding.showHeaderNameHelp")}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.branding.siteDescription")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={4}
                placeholder={t(
                  "dashboard.site.configuration.branding.siteDescriptionPlaceholder"
                )}
                className="resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <SaveButton isLoading={isSaving} />
    </TabsContent>
  );
}
