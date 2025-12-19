import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@learnbase/ui";
import { TabsContent } from "@/components/ui/tabs";

import { SaveButton } from "../save-button";
import type { ConfigurationFormData } from "../schema";

type ContactTabProps = {
  isSaving: boolean;
};

export function ContactTab({ isSaving }: ContactTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<ConfigurationFormData>();

  return (
    <TabsContent value="contact" className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.contact.email")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder={t(
                    "dashboard.site.configuration.contact.emailPlaceholder"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.configuration.contact.phone")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t(
                    "dashboard.site.configuration.contact.phonePlaceholder"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="contactAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("dashboard.site.configuration.contact.address")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder={t(
                  "dashboard.site.configuration.contact.addressPlaceholder"
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
