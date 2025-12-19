import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@learnbase/ui";
import { Textarea } from "@learnbase/ui";
import { TabsContent } from "@learnbase/ui";

import { SaveButton } from "../save-button";
import type { CustomizationFormData } from "../schema";

type TextsTabProps = {
  isSaving: boolean;
};

export function TextsTab({ isSaving }: TextsTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<CustomizationFormData>();

  return (
    <TabsContent value="texts" className="space-y-6">
      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-medium">Hero</h3>
        </div>
        <div className="space-y-4 p-5">
          <FormField
            control={form.control}
            name="heroTitle"
            render={({ field }) => (
              <FormItem className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
                <FormLabel className="text-muted-foreground">
                  {t("dashboard.site.customization.texts.heroTitle")}
                </FormLabel>
                <div className="space-y-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "dashboard.site.customization.texts.heroTitlePlaceholder"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="heroSubtitle"
            render={({ field }) => (
              <FormItem className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-start">
                <FormLabel className="text-muted-foreground sm:pt-2">
                  {t("dashboard.site.customization.texts.heroSubtitle")}
                </FormLabel>
                <div className="space-y-1">
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder={t(
                        "dashboard.site.customization.texts.heroSubtitlePlaceholder"
                      )}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="heroCta"
            render={({ field }) => (
              <FormItem className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
                <FormLabel className="text-muted-foreground">
                  {t("dashboard.site.customization.texts.heroCta")}
                </FormLabel>
                <div className="space-y-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "dashboard.site.customization.texts.heroCtaPlaceholder"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-medium">Footer</h3>
        </div>
        <div className="p-5">
          <FormField
            control={form.control}
            name="footerText"
            render={({ field }) => (
              <FormItem className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
                <FormLabel className="text-muted-foreground">
                  {t("dashboard.site.customization.texts.footerText")}
                </FormLabel>
                <div className="space-y-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "dashboard.site.customization.texts.footerTextPlaceholder"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      <SaveButton isLoading={isSaving} />
    </TabsContent>
  );
}
