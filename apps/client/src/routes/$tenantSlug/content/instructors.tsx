import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpen, Calendar, Ellipsis, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useGetInstructors,
  useCreateInstructor,
  useUpdateInstructor,
  useDeleteInstructor,
  type Instructor,
} from "@/services/instructors";

export const Route = createFileRoute("/$tenantSlug/content/instructors")({
  component: InstructorsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
  }),
});

const instructorSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

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

  const [editorOpen, setEditorOpen] = useState(false);
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);
  const [deleteInstructor, setDeleteInstructor] = useState<Instructor | null>(
    null
  );

  const createMutation = useCreateInstructor();
  const updateMutation = useUpdateInstructor();
  const deleteMutation = useDeleteInstructor();

  const form = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: "",
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
      form.reset({
        name: editInstructor.name,
        title: editInstructor.title ?? "",
        email: editInstructor.email ?? "",
        bio: editInstructor.bio ?? "",
        website: editInstructor.website ?? "",
        twitter: editInstructor.socialLinks?.twitter ?? "",
        linkedin: editInstructor.socialLinks?.linkedin ?? "",
        github: editInstructor.socialLinks?.github ?? "",
      });
    } else {
      form.reset({
        name: "",
        title: "",
        email: "",
        bio: "",
        website: "",
        twitter: "",
        linkedin: "",
        github: "",
      });
    }
  }, [editInstructor, form]);

  const handleOpenCreate = useCallback(() => {
    setEditInstructor(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((instructor: Instructor) => {
    setEditInstructor(instructor);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(
    (open: boolean) => {
      if (!open) {
        setEditorOpen(false);
        setEditInstructor(null);
        form.reset();
      }
    },
    [form]
  );

  const handleSubmit = useCallback(
    (values: InstructorFormData) => {
      const socialLinks =
        values.twitter || values.linkedin || values.github
          ? {
              twitter: values.twitter || undefined,
              linkedin: values.linkedin || undefined,
              github: values.github || undefined,
            }
          : undefined;

      const payload = {
        name: values.name,
        title: values.title || undefined,
        email: values.email || undefined,
        bio: values.bio || undefined,
        website: values.website || undefined,
        socialLinks,
      };

      if (editInstructor) {
        updateMutation.mutate(
          { id: editInstructor.id, ...payload },
          { onSuccess: () => handleCloseEditor(false) }
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => handleCloseEditor(false),
        });
      }
    },
    [editInstructor, createMutation, updateMutation, handleCloseEditor]
  );

  const handleDelete = useCallback(() => {
    if (!deleteInstructor) return;
    deleteMutation.mutate(deleteInstructor.id, {
      onSuccess: () => setDeleteInstructor(null),
    });
  }, [deleteInstructor, deleteMutation]);

  const isPending = createMutation.isPending || updateMutation.isPending;

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
              <div className="font-medium text-foreground">
                {row.original.name}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteInstructor(row.original)}
              >
                {t("common.delete")}
              </DropdownMenuItem>
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
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("instructors.create.button")}
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
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              {t("instructors.create.button")}
            </Button>
          ),
        }}
      />

      <Dialog open={editorOpen} onOpenChange={handleCloseEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editInstructor
                ? t("instructors.edit.title")
                : t("instructors.create.title")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("instructors.form.name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                <FormField
                  control={form.control}
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
              </div>
              <FormField
                control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  onClick={() => handleCloseEditor(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {editInstructor ? t("common.save") : t("common.create")}
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
    </div>
  );
}
