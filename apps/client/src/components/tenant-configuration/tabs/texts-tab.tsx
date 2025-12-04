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
import type { ConfigurationFormData } from "../schema";

type TextsTabProps = {
  isSaving: boolean;
};

export function TextsTab({ isSaving }: TextsTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<ConfigurationFormData>();

  return (
    <TabsContent value="texts" className="space-y-6">
      <FormField
        control={form.control}
        name="heroTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.texts.heroTitle")}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t(
                  "dashboard.site.configuration.texts.heroTitlePlaceholder"
                )}
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.configuration.texts.heroTitleHelp")}
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
              {t("dashboard.site.configuration.texts.heroSubtitle")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder={t(
                  "dashboard.site.configuration.texts.heroSubtitlePlaceholder"
                )}
                className="resize-none"
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.configuration.texts.heroSubtitleHelp")}
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
                {t("dashboard.site.configuration.texts.heroCta")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.texts.heroCtaPlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.texts.heroCtaHelp")}
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
                {t("dashboard.site.configuration.texts.footerText")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.texts.footerTextPlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.texts.footerTextHelp")}
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
