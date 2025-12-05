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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";

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
      <FormField
        control={form.control}
        name="heroTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.customization.texts.heroTitle")}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t(
                  "dashboard.site.customization.texts.heroTitlePlaceholder"
                )}
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.customization.texts.heroTitleHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="heroSubtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.customization.texts.heroSubtitle")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder={t(
                  "dashboard.site.customization.texts.heroSubtitlePlaceholder"
                )}
                className="resize-none"
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.customization.texts.heroSubtitleHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="heroCta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.customization.texts.heroCta")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.customization.texts.heroCtaPlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.texts.heroCtaHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="footerText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.customization.texts.footerText")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.customization.texts.footerTextPlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.texts.footerTextHelp")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <SaveButton isLoading={isSaving} />
    </TabsContent>
  );
}
