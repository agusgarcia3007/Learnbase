import { HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Progress } from "@/components/ui/progress";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/services/subscription";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function SidebarStorageCard() {
  const { t } = useTranslation();
  const { open } = useSidebar();
  const { data: subscription } = useSubscription();

  if (!subscription) {
    return null;
  }

  const { storageUsedBytes, storageLimitBytes } = subscription;
  const usagePercent = Math.min(
    100,
    Math.round((storageUsedBytes / storageLimitBytes) * 100)
  );
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 95;

  const usedFormatted = formatBytes(storageUsedBytes);
  const limitFormatted = formatBytes(storageLimitBytes);

  if (!open) {
    return (
      <SidebarMenu className="px-2 pb-2">
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                className={
                  isAtLimit
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : isNearLimit
                      ? "bg-warning/10 text-warning-foreground hover:bg-warning/20"
                      : ""
                }
              >
                <div className="relative">
                  <HardDrive className="size-4" />
                  <span
                    className={`absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      isAtLimit
                        ? "bg-destructive text-destructive-foreground"
                        : isNearLimit
                          ? "bg-warning text-warning-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {usagePercent}
                  </span>
                </div>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t("billing.storage.usage", {
                used: usedFormatted,
                limit: limitFormatted,
              })}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="px-2 pb-2">
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-medium">
            <HardDrive className="size-4 shrink-0" />
            <span>{t("billing.storage.title")}</span>
          </div>
          <span className="text-muted-foreground text-xs">{usagePercent}%</span>
        </div>
        <Progress
          value={usagePercent}
          className={`mt-2 h-1.5 ${
            isAtLimit
              ? "[&>div]:bg-destructive"
              : isNearLimit
                ? "[&>div]:bg-warning"
                : ""
          }`}
        />
        <p className="text-muted-foreground mt-1.5 text-xs">
          {t("billing.storage.usage", {
            used: usedFormatted,
            limit: limitFormatted,
          })}
        </p>
      </div>
    </div>
  );
}
