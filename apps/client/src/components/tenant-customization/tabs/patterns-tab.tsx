import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
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
    <TabsContent value="patterns" className="space-y-6">
      <div className="rounded-xl border bg-card">
        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="heroPattern"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.site.customization.patterns.heroPattern")}
                </FormLabel>
                <FormControl>
                  <PatternSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coursesPagePattern"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.site.customization.patterns.coursesPagePattern")}
                </FormLabel>
                <FormControl>
                  <PatternSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <SaveButton isLoading={isSaving} />
    </TabsContent>
  );
}
