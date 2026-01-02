import { useTranslation } from "react-i18next";
import { UserPlus, CheckCircle, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAssetUrl } from "@/lib/constants";
import type { TenantActivity, TenantActivityType } from "@/services/tenants";
import { formatDistanceToNow } from "date-fns";

type RecentActivityProps = {
  activities: TenantActivity[] | undefined;
  isLoading: boolean;
};

const activityIcons: Record<TenantActivityType, typeof UserPlus> = {
  enrollment: UserPlus,
  completion: CheckCircle,
  certificate: Award,
};

const activityColors: Record<TenantActivityType, string> = {
  enrollment: "text-blue-500",
  completion: "text-green-500",
  certificate: "text-amber-500",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {t("dashboard.home.activity.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("dashboard.home.activity.noActivity")}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const iconColor = activityColors[activity.type];

              return (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={getAssetUrl(activity.userAvatar)} />
                    <AvatarFallback className="text-xs">
                      {getInitials(activity.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>{" "}
                      <span className="text-muted-foreground">
                        {t(`dashboard.home.activity.types.${activity.type}`)}
                      </span>{" "}
                      <span className="font-medium truncate">{activity.courseName}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon className={`size-3 ${iconColor}`} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
