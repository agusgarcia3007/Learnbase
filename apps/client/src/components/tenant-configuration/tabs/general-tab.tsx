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
import { Textarea } from "@learnbase/ui";
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";

import { SaveButton } from "../save-button";
import type { ConfigurationFormData } from "../schema";

type GeneralTabProps = {
  isSlugChanged: boolean;
  isSaving: boolean;
};

export function GeneralTab({ isSlugChanged, isSaving }: GeneralTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<ConfigurationFormData>();

  return (
    <TabsContent value="general" className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.general.slug")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.general.slugPlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.general.slugHelp")}
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
                {t("dashboard.site.configuration.general.name")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.general.namePlaceholder"
                  )}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.configuration.general.nameHelp")}
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
            {t("dashboard.site.configuration.general.slugWarning")}
          </AlertDescription>
        </Alert>
      )}

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.general.descriptionLabel")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={4}
                placeholder={t(
                  "dashboard.site.configuration.general.descriptionPlaceholder"
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
