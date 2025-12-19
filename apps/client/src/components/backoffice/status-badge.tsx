import { useTranslation } from "react-i18next";
import { Badge } from "@learnbase/ui";

type Status = "draft" | "published" | "archived" | "active" | "completed" | "cancelled";

const STATUS_VARIANTS: Record<Status, "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  published: "success",
  archived: "warning",
  active: "success",
  completed: "success",
  cancelled: "destructive",
};

type StatusBadgeProps = {
  status: Status;
  translationPrefix?: string;
};

export function StatusBadge({
  status,
  translationPrefix = "statuses",
}: StatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={STATUS_VARIANTS[status]} appearance="light" size="sm">
      {t(`${translationPrefix}.${status}`)}
    </Badge>
  );
}
