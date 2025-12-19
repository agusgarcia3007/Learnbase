import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpen, Calendar, Ellipsis, Plus, Crown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@learnbase/ui";
import { getInitials } from "@/lib/format";
import { Badge } from "@learnbase/ui";
import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { Textarea } from "@learnbase/ui";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@learnbase/ui";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useGetInstructors,
  useInviteInstructor,
  usePromoteInstructor,
  useUpdateInstructor,
  useDeleteInstructor,
  type Instructor,
  type ExistingUser,
} from "@/services/instructors";
import { toast } from "sonner";
import { createSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/$tenantSlug/management/instructors")({
  head: () =>
    createSeoMeta({
      title: "Instructors",
      description: "Manage your instructors",
      noindex: true,
    }),
  component: InstructorsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
  }),
});

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
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

function InstructorsPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "order", order: "asc" },
  });

  const { data, isLoading } = useGetInstructors({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [deleteInstructor, setDeleteInstructor] = useState<Instructor | null>(
    null
  );
  const [existingUserToPromote, setExistingUserToPromote] = useState<{
    user: ExistingUser;
    formData: InviteFormData;
  } | null>(null);

  const inviteMutation = useInviteInstructor();
  const promoteMutation = usePromoteInstructor();
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
    } else {
      editForm.reset({
        title: "",
        email: "",
        bio: "",
        website: "",
        twitter: "",
        linkedin: "",
        github: "",
      });
    }
  }, [editInstructor, editForm]);

  const handleOpenInvite = useCallback(() => {
    setInviteOpen(true);
  }, []);

  const handleCloseInvite = useCallback(
    (open: boolean) => {
      if (!open) {
        setInviteOpen(false);
        inviteForm.reset();
      }
    },
    [inviteForm]
  );

  const handleOpenEdit = useCallback((instructor: Instructor) => {
    setEditInstructor(instructor);
  }, []);

  const handleCloseEdit = useCallback(
    (open: boolean) => {
      if (!open) {
        setEditInstructor(null);
        editForm.reset();
      }
    },
    [editForm]
  );

  const handleInviteSubmit = useCallback(
    (values: InviteFormData) => {
      inviteMutation.mutate(
        {
          email: values.email,
          name: values.name,
          title: values.title || undefined,
        },
        {
          onSuccess: (response) => {
            if (response.userExists) {
              if (response.existingUser.hasInstructorProfile) {
                toast.error(t("instructors.invite.alreadyInstructor"));
                handleCloseInvite(false);
              } else {
                setExistingUserToPromote({
                  user: response.existingUser,
                  formData: values,
                });
              }
            } else {
              handleCloseInvite(false);
            }
          },
        }
      );
    },
    [inviteMutation, handleCloseInvite, t]
  );

  const handleEditSubmit = useCallback(
    (values: EditFormData) => {
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
        { onSuccess: () => handleCloseEdit(false) }
      );
    },
    [editInstructor, updateMutation, handleCloseEdit]
  );

  const handleDelete = useCallback(() => {
    if (!deleteInstructor) return;
    deleteMutation.mutate(deleteInstructor.id, {
      onSuccess: () => setDeleteInstructor(null),
    });
  }, [deleteInstructor, deleteMutation]);

  const handlePromote = useCallback(() => {
    if (!existingUserToPromote) return;

    promoteMutation.mutate(
      {
        userId: existingUserToPromote.user.id,
        title: existingUserToPromote.formData.title || undefined,
      },
      {
        onSuccess: () => {
          setExistingUserToPromote(null);
          handleCloseInvite(false);
        },
      }
    );
  }, [existingUserToPromote, promoteMutation, handleCloseInvite]);

  const handleCancelPromote = useCallback(() => {
    setExistingUserToPromote(null);
  }, []);

  const columns = useMemo<ColumnDef<Instructor>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("instructors.columns.name")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage
                src={row.original.avatar ?? undefined}
                alt={row.original.name}
              />
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-px">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {row.original.name}
                </span>
                {row.original.isOwner && (
                  <Badge variant="secondary" size="sm" className="gap-1">
                    <Crown className="size-3" />
                    Owner
                  </Badge>
                )}
              </div>
              {row.original.title && (
                <div className="text-muted-foreground text-xs">
                  {row.original.title}
                </div>
              )}
            </div>
          </div>
        ),
        size: 300,
        enableSorting: true,
        meta: {
          headerTitle: t("instructors.columns.name"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("instructors.columns.email")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.email ?? "-"}
          </span>
        ),
        size: 200,
        enableSorting: false,
        meta: {
          headerTitle: t("instructors.columns.email"),
          skeleton: <Skeleton className="h-4 w-36" />,
        },
      },
      {
        accessorKey: "coursesCount",
        id: "coursesCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("instructors.columns.courses")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" size="sm" className="gap-1">
            <BookOpen className="size-3" />
            {row.original.coursesCount}
          </Badge>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("instructors.columns.courses"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("instructors.columns.createdAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("instructors.columns.createdAt"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-7" mode="icon" variant="ghost">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={() => handleOpenEdit(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              {!row.original.isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteInstructor(row.original)}
                  >
                    {t("common.delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, handleOpenEdit]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "createdAt",
        label: t("instructors.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const instructors = data?.instructors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("instructors.title")}</h1>
          <p className="text-muted-foreground">{t("instructors.description")}</p>
        </div>
        <Button onClick={handleOpenInvite}>
          <Plus className="size-4" />
          {t("instructors.invite.button")}
        </Button>
      </div>

      <DataTable
        data={instructors}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        emptyState={{
          title: t("instructors.empty.title"),
          description: t("instructors.empty.description"),
          action: (
            <Button onClick={handleOpenInvite}>
              <Plus className="size-4" />
              {t("instructors.invite.button")}
            </Button>
          ),
        }}
      />

      <Dialog open={inviteOpen} onOpenChange={handleCloseInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("instructors.invite.title")}</DialogTitle>
          </DialogHeader>
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(handleInviteSubmit)}
              className="space-y-4"
            >
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructors.invite.emailLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructors.invite.nameLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructors.invite.titleLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("instructors.form.titlePlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseInvite(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" isLoading={inviteMutation.isPending}>
                  {t("instructors.invite.button")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editInstructor} onOpenChange={handleCloseEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("instructors.edit.title")}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("instructors.form.title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("instructors.form.titlePlaceholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("instructors.form.email")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructors.form.website")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("instructors.form.bio")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>{t("instructors.form.socialLinks")}</FormLabel>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={editForm.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Twitter" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="LinkedIn" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="github"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="GitHub" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseEdit(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" isLoading={updateMutation.isPending}>
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteInstructor}
        onOpenChange={(open) => !open && setDeleteInstructor(null)}
        title={t("instructors.delete.title")}
        description={t("instructors.delete.description", {
          name: deleteInstructor?.name,
        })}
        confirmValue={deleteInstructor?.name ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <AlertDialog
        open={!!existingUserToPromote}
        onOpenChange={(open) => !open && handleCancelPromote()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("instructors.promote.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("instructors.promote.description", {
                name: existingUserToPromote?.user.name,
                email: existingUserToPromote?.user.email,
                currentRole: existingUserToPromote?.user.role,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPromote}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromote}
              disabled={promoteMutation.isPending}
            >
              {promoteMutation.isPending
                ? t("instructors.promote.promoting")
                : t("instructors.promote.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
