import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import { Input } from "@learnbase/ui";
import { Label } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@learnbase/ui";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["instructor", "student"]),
});

type FormData = z.infer<typeof schema>;

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  isPending?: boolean;
};

const ROLES = ["instructor", "student"] as const;

export function InviteUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: InviteUserDialogProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      name: "",
      role: "student",
    },
  });

  const currentRole = watch("role");

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
    reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.users.invite.title")}</DialogTitle>
          <DialogDescription>
            {t("dashboard.users.invite.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("dashboard.users.invite.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("dashboard.users.invite.emailPlaceholder")}
              {...register("email")}
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("dashboard.users.invite.nameLabel")}</Label>
            <Input
              id="name"
              placeholder={t("dashboard.users.invite.namePlaceholder")}
              {...register("name")}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t("dashboard.users.invite.roleLabel")}</Label>
            <Select
              value={currentRole}
              onValueChange={(value) =>
                setValue("role", value as "instructor" | "student")
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("dashboard.users.invite.rolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t("dashboard.users.invite.button")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
