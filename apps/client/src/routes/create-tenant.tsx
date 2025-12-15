import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSeoMeta } from "@/lib/seo";
import { BASE_DOMAIN, getCampusUrl } from "@/lib/tenant";
import { profileOptions } from "@/services/profile/options";
import { useCreateTenant } from "@/services/tenants/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const Route = createFileRoute("/create-tenant")({
  ssr: false,
  head: () =>
    createSeoMeta({
      title: "Create Your LMS",
      description: "Set up your learning management system with LearnBase",
      noindex: true,
    }),
  beforeLoad: async ({ context }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw redirect({ to: "/login" });
    }

    const data = await context.queryClient.ensureQueryData(profileOptions());

    if (!data?.user) {
      throw redirect({ to: "/login" });
    }

    if (data.user.role !== "owner" || data.user.tenantId !== null) {
      throw redirect({ to: "/" });
    }

    return { user: data.user };
  },
  component: CreateTenantPage,
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function CreateTenantPage() {
  const { t } = useTranslation();
  const { mutate: createTenant, isPending } = useCreateTenant();
  const slugManuallyEdited = useRef(false);

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", slug: "" },
  });

  const nameValue = form.watch("name");
  const slugValue = form.watch("slug");

  useEffect(() => {
    if (slugManuallyEdited.current) return;
    const generatedSlug = generateSlug(nameValue);
    form.setValue("slug", generatedSlug);
  }, [nameValue, form]);

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugManuallyEdited.current = true;
    form.setValue("slug", e.target.value);
  }

  function onSubmit(data: CreateTenantInput) {
    createTenant(data, {
      onSuccess: (response) => {
        window.location.href = getCampusUrl(response.tenant.slug);
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("createTenant.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {t("createTenant.description")}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createTenant.nameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("createTenant.namePlaceholder")} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("createTenant.nameHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("createTenant.slugLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("createTenant.slugPlaceholder")}
                        {...field}
                        onChange={handleSlugChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("createTenant.slugHelp", {
                        domain: `${slugValue || "slug"}.${BASE_DOMAIN}`,
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" isLoading={isPending}>
                {t("createTenant.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
