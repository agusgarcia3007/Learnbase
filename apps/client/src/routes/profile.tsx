import { Button } from "@learnbase/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@learnbase/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import { Header } from "@/components/header";
import AvatarUpload from "@/components/file-upload/avatar-upload";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/schemas/profile";
import { createSeoMeta } from "@/lib/seo";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { getCampusTenantServer } from "@/services/campus/server";
import { useGetProfile } from "@/services/profile/queries";
import { useUpdateProfile } from "@/services/profile/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export const Route = createFileRoute("/profile")({
  ssr: false,
  loader: async () => {
    const tenantInfo = await getTenantFromRequest({ data: {} });
    const tenant = tenantInfo.slug
      ? await getCampusTenantServer({ data: { slug: tenantInfo.slug } }).then(
          (r) => r?.tenant
        )
      : null;
    return { tenant };
  },
  head: ({ loaderData }) => {
    const tenantName = loaderData?.tenant?.name || "LearnBase";
    return createSeoMeta({
      title: "Profile",
      description: `Manage your ${tenantName} profile settings`,
      siteName: tenantName,
      noindex: true,
    });
  },
  component: ProfilePage,
});

function ProfileSkeleton() {
  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="size-24 rounded-full" />
        <div className="text-center space-y-1">
          <Skeleton className="h-4 w-28 mx-auto" />
          <Skeleton className="h-3 w-36 mx-auto" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-10 w-36" />
        </CardContent>
      </Card>
    </>
  );
}

function ProfilePage() {
  const { t } = useTranslation();
  const { data: profileData, isLoading } = useGetProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const user = profileData?.user;

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name });
    }
  }, [user, form]);

  function onSubmit(data: UpdateProfileInput) {
    updateProfile(data.name);
  }

  return (
    <div>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        {isLoading ? (
          <ProfileSkeleton />
        ) : user ? (
          <>
            <AvatarUpload currentAvatar={user.avatar} userName={user.name} />

            <Card>
              <CardHeader>
                <CardTitle>{t("profile.title")}</CardTitle>
                <CardDescription>{t("profile.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.name")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder={t("profile.namePlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>{t("common.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" value={user.email} disabled />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        {t("profile.emailReadonly")}
                      </p>
                    </FormItem>

                    <Button type="submit" isLoading={isPending}>
                      {t("profile.saveChanges")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
