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
import { Textarea } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@learnbase/ui";
import type {
  FeaturePriority,
  FeatureStatus,
  CreateFeatureDirectRequest,
} from "@/services/features";

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["ideas", "in_progress", "shipped"]),
});

type FormData = z.infer<typeof schema>;

interface FeatureCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFeatureDirectRequest) => void;
  isPending?: boolean;
}

const PRIORITIES: FeaturePriority[] = ["low", "medium", "high", "critical"];
const STATUSES: Exclude<FeatureStatus, "pending">[] = [
  "ideas",
  "in_progress",
  "shipped",
];

export function FeatureCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: FeatureCreateDialogProps) {
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
      title: "",
      description: "",
      priority: "medium",
      status: "ideas",
    },
  });

  const currentPriority = watch("priority");
  const currentStatus = watch("status");

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("features.create.title")}</DialogTitle>
          <DialogDescription>
            {t("features.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("features.create.titleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("features.create.titlePlaceholder")}
              {...register("title")}
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("features.create.descriptionLabel")}
            </Label>
            <Textarea
              id="description"
              placeholder={t("features.create.descriptionPlaceholder")}
              rows={4}
              {...register("description")}
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-destructive text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">
                {t("features.create.priorityLabel")}
              </Label>
              <Select
                value={currentPriority}
                onValueChange={(value) =>
                  setValue("priority", value as FeaturePriority)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {t(`features.priority.${priority}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("features.create.statusLabel")}</Label>
              <Select
                value={currentStatus}
                onValueChange={(value) =>
                  setValue("status", value as Exclude<FeatureStatus, "pending">)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`features.columns.${status === "in_progress" ? "inProgress" : status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {t("features.create.button")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
