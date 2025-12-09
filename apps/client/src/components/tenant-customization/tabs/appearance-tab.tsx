import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { Sparkles } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/file-upload/image-upload";

import { ThemeSelector } from "@/components/tenant-configuration/theme-selector";
import { ModeSelector } from "../mode-selector";
import { SaveButton } from "../save-button";
import { AiThemeModal } from "../ai-theme-modal";
import type { CustomizationFormData } from "../schema";
import type { GeneratedTheme } from "@/services/ai";

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
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleThemeChange = (theme: CustomizationFormData["theme"]) => {
    form.setValue("theme", theme);
    form.setValue("customTheme", null);
  };

  const handleApplyAiTheme = (theme: GeneratedTheme) => {
    form.setValue("customTheme", theme);
    form.setValue("theme", null);
  };

  const customTheme = form.watch("customTheme");

  return (
    <TabsContent value="appearance" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {t("dashboard.site.customization.appearance.logo")}
          </p>
          <ImageUpload
            value={logoUrl}
            onChange={onLogoChange}
            onUpload={onLogoUpload}
            onDelete={onLogoDelete}
            aspectRatio="1/1"
            maxSize={2 * 1024 * 1024}
            isUploading={isUploadingLogo}
            isDeleting={isDeletingLogo}
          />
          <p className="text-xs text-muted-foreground">
            {t("dashboard.site.customization.appearance.logoHelp")}
          </p>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="space-y-4 p-5">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("dashboard.site.customization.appearance.theme")}
                  </FormLabel>
                  <FormControl>
                    <ThemeSelector
                      value={field.value}
                      onChange={handleThemeChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAiModalOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("dashboard.site.customization.appearance.generateWithAI")}
              </Button>
              {customTheme && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-primary"
                    style={{ backgroundColor: customTheme.primary }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("dashboard.site.customization.appearance.customThemeActive")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          <div className="space-y-4 p-5">
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("dashboard.site.customization.appearance.mode")}
                  </FormLabel>
                  <FormControl>
                    <ModeSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t" />

          <div className="p-5">
            <FormField
              control={form.control}
              name="showHeaderName"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="font-normal">
                    {t("dashboard.site.customization.appearance.showHeaderName")}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <SaveButton isLoading={isSaving} />

      <AiThemeModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApply={handleApplyAiTheme}
      />
    </TabsContent>
  );
}
