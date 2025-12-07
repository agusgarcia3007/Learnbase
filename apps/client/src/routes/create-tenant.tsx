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
import { profileOptions } from "@/services/profile/options";
import { useCreateTenant } from "@/services/tenants/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") {
      return {};
    }

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
  const navigate = useNavigate();
  const { mutate: createTenant, isPending } = useCreateTenant();

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", slug: "" },
  });

  const nameValue = form.watch("name");

  useEffect(() => {
    const currentSlug = form.getValues("slug");
    const generatedSlug = generateSlug(nameValue);

    if (!currentSlug || currentSlug === generateSlug(form.getValues("name").slice(0, -1))) {
      form.setValue("slug", generatedSlug);
    }
  }, [nameValue, form]);

  function onSubmit(data: CreateTenantInput) {
    createTenant(data, {
      onSuccess: (response) => {
        navigate({
          to: "/$tenantSlug",
          params: { tenantSlug: response.tenant.slug },
        });
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your LMS</CardTitle>
          <p className="text-muted-foreground text-sm">
            Set up your learning management system
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
                    <FormLabel>LMS Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Academy" {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for your learning platform
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
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="my-academy" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your LMS will be available at{" "}
                      <span className="font-medium">
                        {field.value || "slug"}.yourdomain.com
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" isLoading={isPending}>
                Create LMS
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
