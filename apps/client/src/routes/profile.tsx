import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/schemas/profile";
import { useGetProfile } from "@/services/profile/queries";
import { useUpdateProfile } from "@/services/profile/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

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
      form.reset({
        name: user.name,
      });
    }
  }, [user, form]);

  function onSubmit(data: UpdateProfileInput) {
    updateProfile({
      name: data.name,
    });
  }

  if (isLoading) {
    return (
      <div>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>{t("profile.loading")}</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
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
      </main>
    </div>
  );
}
