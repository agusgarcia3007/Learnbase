import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/file-upload/image-upload";

import { ThemeSelector } from "@/components/tenant-configuration/theme-selector";
import { ModeSelector } from "../mode-selector";
import { SaveButton } from "../save-button";
import type { CustomizationFormData } from "../schema";

type AppearanceTabProps = {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  onLogoUpload: (base64: string) => Promise<string>;
  onLogoDelete: () => Promise<void>;
  isUploadingLogo: boolean;
  isDeletingLogo: boolean;
  isSaving: boolean;
};

export function AppearanceTab({
  logoUrl,
  onLogoChange,
  onLogoUpload,
  onLogoDelete,
  isUploadingLogo,
  isDeletingLogo,
  isSaving,
}: AppearanceTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<CustomizationFormData>();

  return (
    <TabsContent value="appearance" className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <FormItem>
          <FormLabel>
            {t("dashboard.site.customization.appearance.logo")}
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
            {t("dashboard.site.customization.appearance.logoHelp")}
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.customization.appearance.theme")}
              </FormLabel>
              <FormControl>
                <ThemeSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.appearance.themeHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="mode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.customization.appearance.mode")}
            </FormLabel>
            <FormControl>
              <ModeSelector
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.customization.appearance.modeHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="showHeaderName"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {t("dashboard.site.customization.appearance.showHeaderName")}
              </FormLabel>
              <FormDescription>
                {t("dashboard.site.customization.appearance.showHeaderNameHelp")}
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

      <SaveButton isLoading={isSaving} />
    </TabsContent>
  );
}
