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
import { TabsContent } from "@/components/ui/tabs";

import { PatternSelector } from "@/components/tenant-configuration/pattern-selector";
import { SaveButton } from "../save-button";
import type { CustomizationFormData } from "../schema";

type PatternsTabProps = {
  isSaving: boolean;
};

export function PatternsTab({ isSaving }: PatternsTabProps) {
  const { t } = useTranslation();
  const form = useFormContext<CustomizationFormData>();

  return (
    <TabsContent value="patterns" className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="heroPattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("dashboard.site.customization.patterns.heroPattern")}
              </FormLabel>
              <FormControl>
                <PatternSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.patterns.heroPatternHelp")}
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
                {t("dashboard.site.customization.patterns.coursesPagePattern")}
              </FormLabel>
              <FormControl>
                <PatternSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("dashboard.site.customization.patterns.coursesPagePatternHelp")}
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
