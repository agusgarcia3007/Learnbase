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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeaturePriority, SubmitFeatureRequest } from "@/services/features";

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

type FormData = z.infer<typeof schema>;

interface FeatureSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubmitFeatureRequest) => void;
  isPending?: boolean;
}

const PRIORITIES: FeaturePriority[] = ["low", "medium", "high", "critical"];

export function FeatureSubmitDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: FeatureSubmitDialogProps) {
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
    },
  });

  const currentPriority = watch("priority");

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
          <DialogTitle>{t("features.submit.title")}</DialogTitle>
          <DialogDescription>
            {t("features.submit.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("features.submit.titleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("features.submit.titlePlaceholder")}
              {...register("title")}
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("features.submit.descriptionLabel")}
            </Label>
            <Textarea
              id="description"
              placeholder={t("features.submit.descriptionPlaceholder")}
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

          <div className="space-y-2">
            <Label htmlFor="priority">
              {t("features.submit.priorityLabel")}
            </Label>
            <Select
              value={currentPriority}
              onValueChange={(value) =>
                setValue("priority", value as FeaturePriority)
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("features.submit.priorityPlaceholder")}
                />
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
              {t("features.submit.button")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
