"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  DotsThree,
  Pencil,
  Trash,
  Chalkboard,
  SpinnerGap,
  BookOpen,
  Crown,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useInstructors,
  useInviteInstructor,
  useUpdateInstructor,
  useDeleteInstructor,
  type Instructor,
} from "@/services/instructors";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
});

const editSchema = z.object({
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;
type EditFormData = z.infer<typeof editSchema>;

export default function InstructorsPage() {
  const { t } = useTranslation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [deleteInstructor, setDeleteInstructor] = useState<Instructor | null>(null);

  const { data, isLoading } = useInstructors();
  const inviteMutation = useInviteInstructor();
  const updateMutation = useUpdateInstructor();
  const deleteMutation = useDeleteInstructor();

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
      title: "",
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      email: "",
      bio: "",
      website: "",
      twitter: "",
      linkedin: "",
      github: "",
    },
  });

  useEffect(() => {
    if (editInstructor) {
      editForm.reset({
        title: editInstructor.title ?? "",
        email: editInstructor.email ?? "",
        bio: editInstructor.bio ?? "",
        website: editInstructor.website ?? "",
        twitter: editInstructor.socialLinks?.twitter ?? "",
        linkedin: editInstructor.socialLinks?.linkedin ?? "",
        github: editInstructor.socialLinks?.github ?? "",
      });
    }
  }, [editInstructor, editForm]);

  const handleCloseInvite = () => {
    setInviteOpen(false);
    inviteForm.reset();
  };

  const handleCloseEdit = () => {
    setEditInstructor(null);
    editForm.reset();
  };

  const handleInvite = (values: InviteFormData) => {
    inviteMutation.mutate(
      { email: values.email, name: values.name, title: values.title || undefined },
      { onSuccess: handleCloseInvite }
    );
  };

  const handleEdit = (values: EditFormData) => {
    if (!editInstructor) return;

    const socialLinks =
      values.twitter || values.linkedin || values.github
        ? {
            twitter: values.twitter || undefined,
            linkedin: values.linkedin || undefined,
            github: values.github || undefined,
          }
        : undefined;

    updateMutation.mutate(
      {
        id: editInstructor.id,
        title: values.title || undefined,
        email: values.email || undefined,
        bio: values.bio || undefined,
        website: values.website || undefined,
        socialLinks,
      },
      { onSuccess: handleCloseEdit }
    );
  };

  const handleDelete = () => {
    if (!deleteInstructor) return;
    deleteMutation.mutate(deleteInstructor.id, {
      onSuccess: () => setDeleteInstructor(null),
    });
  };

  const instructors = data?.instructors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("instructors.title")}</h1>
          <p className="text-muted-foreground">{t("instructors.description")}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("instructors.invite.button")}
        </Button>
      </div>

      {isLoading ? (
        <InstructorsTableSkeleton />
      ) : instructors.length === 0 ? (
        <EmptyState onInviteClick={() => setInviteOpen(true)} />
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("instructors.columns.name")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("instructors.columns.email")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("instructors.columns.courses")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("instructors.columns.createdAt")}
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                        {instructor.avatar ? (
                          <img
                            src={instructor.avatar}
                            alt={instructor.name}
                            className="size-9 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {instructor.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{instructor.name}</span>
                          {instructor.isOwner && (
                            <Badge variant="secondary" className="gap-1">
                              <Crown className="size-3" weight="fill" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        {instructor.title && (
                          <div className="text-xs text-muted-foreground">
                            {instructor.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {instructor.email ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="gap-1">
                      <BookOpen className="size-3" />
                      {instructor.coursesCount}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {new Date(instructor.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                        <DotsThree className="size-5" weight="bold" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditInstructor(instructor)}>
                          <Pencil className="mr-2 size-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        {!instructor.isOwner && (
                          <DropdownMenuItem
                            onClick={() => setDeleteInstructor(instructor)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 size-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={(open) => !open && handleCloseInvite()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("instructors.invite.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("instructors.invite.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                {...inviteForm.register("email")}
              />
              {inviteForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {inviteForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("instructors.invite.nameLabel")}</Label>
              <Input
                id="name"
                {...inviteForm.register("name")}
              />
              {inviteForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {inviteForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">{t("instructors.invite.titleLabel")}</Label>
              <Input
                id="title"
                {...inviteForm.register("title")}
                placeholder={t("instructors.form.titlePlaceholder")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseInvite}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
                {t("instructors.invite.button")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editInstructor} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("instructors.edit.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTitle">{t("instructors.form.title")}</Label>
                <Input
                  id="editTitle"
                  {...editForm.register("title")}
                  placeholder={t("instructors.form.titlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">{t("instructors.form.email")}</Label>
                <Input
                  id="editEmail"
                  type="email"
                  {...editForm.register("email")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t("instructors.form.website")}</Label>
              <Input
                id="website"
                {...editForm.register("website")}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t("instructors.form.bio")}</Label>
              <Textarea
                id="bio"
                {...editForm.register("bio")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("instructors.form.socialLinks")}</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  {...editForm.register("twitter")}
                  placeholder="Twitter"
                />
                <Input
                  {...editForm.register("linkedin")}
                  placeholder="LinkedIn"
                />
                <Input
                  {...editForm.register("github")}
                  placeholder="GitHub"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEdit}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteInstructor} onOpenChange={(open) => !open && setDeleteInstructor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("instructors.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("instructors.delete.description", { name: deleteInstructor?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <SpinnerGap className="mr-2 size-4 animate-spin" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onInviteClick }: { onInviteClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Chalkboard className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{t("instructors.empty.title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("instructors.empty.description")}
      </p>
      <Button onClick={onInviteClick} className="mt-4 gap-2">
        <Plus className="size-4" />
        {t("instructors.invite.button")}
      </Button>
    </div>
  );
}

function InstructorsTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="size-8" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
