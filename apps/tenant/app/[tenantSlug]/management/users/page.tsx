"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  DotsThree,
  Pencil,
  Trash,
  UserCircle,
  SpinnerGap,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useUsers,
  useInviteUser,
  useUpdateUser,
  useDeleteUser,
  type TenantUser,
  type UserRole,
} from "@/services/users";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "student"]),
});

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "student"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;
type EditFormData = z.infer<typeof editSchema>;

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  superadmin: "default",
  owner: "default",
  admin: "secondary",
  student: "outline",
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<TenantUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<TenantUser | null>(null);

  const { data, isLoading } = useUsers();
  const inviteMutation = useInviteUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "student",
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      role: "student",
    },
  });

  useEffect(() => {
    if (editUser) {
      editForm.reset({
        name: editUser.name,
        role: editUser.role === "owner" || editUser.role === "superadmin" ? "admin" : editUser.role,
      });
    }
  }, [editUser, editForm]);

  const handleCloseInvite = () => {
    setInviteOpen(false);
    inviteForm.reset();
  };

  const handleCloseEdit = () => {
    setEditUser(null);
    editForm.reset();
  };

  const handleInvite = (values: InviteFormData) => {
    inviteMutation.mutate(values, { onSuccess: handleCloseInvite });
  };

  const handleEdit = (values: EditFormData) => {
    if (!editUser) return;
    updateMutation.mutate(
      { id: editUser.id, ...values },
      { onSuccess: handleCloseEdit }
    );
  };

  const handleDelete = () => {
    if (!deleteUser) return;
    deleteMutation.mutate(deleteUser.id, {
      onSuccess: () => setDeleteUser(null),
    });
  };

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("users.title")}</h1>
          <p className="text-muted-foreground">{t("users.description")}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("users.invite.button")}
        </Button>
      </div>

      {isLoading ? (
        <UsersTableSkeleton />
      ) : users.length === 0 ? (
        <EmptyState onInviteClick={() => setInviteOpen(true)} />
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("users.columns.name")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("users.columns.role")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("users.columns.enrolled")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("users.columns.progress")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("users.columns.verified")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("users.columns.lastActivity")}
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANTS[user.role]}>
                      {t(`roles.${user.role}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{user.enrollmentsCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{Math.round(user.avgProgress)}%</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.emailVerified ? (
                      <CheckCircle className="size-4 text-green-600" weight="fill" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {user.lastActivity
                        ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== "owner" && user.role !== "superadmin" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                          <DotsThree className="size-5" weight="bold" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Pencil className="mr-2 size-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteUser(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 size-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
            <DialogTitle>{t("users.invite.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("users.form.email")}</Label>
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
              <Label htmlFor="name">{t("users.form.name")}</Label>
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
              <Label>{t("users.form.role")}</Label>
              <Controller
                name="role"
                control={inviteForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{t("roles.student")}</SelectItem>
                      <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseInvite}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
                {t("users.invite.button")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.edit.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">{t("users.form.name")}</Label>
              <Input
                id="editName"
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("users.form.role")}</Label>
              <Controller
                name="role"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{t("roles.student")}</SelectItem>
                      <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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

      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.delete.description", { name: deleteUser?.name })}
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
        <UserCircle className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{t("users.empty.title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("users.empty.description")}
      </p>
      <Button onClick={onInviteClick} className="mt-4 gap-2">
        <Plus className="size-4" />
        {t("users.invite.button")}
      </Button>
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
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
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
              <td className="px-4 py-3"><Skeleton className="size-4" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="size-8" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
