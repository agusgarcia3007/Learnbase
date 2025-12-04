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

type SeoTabProps = {
  isSaving: boolean;
};

export function SeoTab({ isSaving }: SeoTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<ConfigurationFormData>();

  return (
    <TabsContent value="seo" className="space-y-6">
      <FormField
        control={form.control}
        name="seoTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.seo.seoTitle")}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t(
                  "dashboard.site.configuration.seo.seoTitlePlaceholder"
                )}
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.configuration.seo.seoTitleHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="seoDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.seo.seoDescription")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder={t(
                  "dashboard.site.configuration.seo.seoDescriptionPlaceholder"
                )}
                className="resize-none"
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.configuration.seo.seoDescriptionHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="seoKeywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.seo.seoKeywords")}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t(
                  "dashboard.site.configuration.seo.seoKeywordsPlaceholder"
                )}
              />
            </FormControl>
            <FormDescription>
              {t("dashboard.site.configuration.seo.seoKeywordsHelp")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <SaveButton isLoading={isSaving} />
    </TabsContent>
  );
}
