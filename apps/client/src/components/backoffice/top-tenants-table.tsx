import { useTranslation } from "react-i18next";
import { Building2, Users, BookOpen } from "lucide-react";
import { Skeleton } from "@learnbase/ui";
import type { TopTenant } from "@/services/dashboard";

type TopTenantsTableProps = {
  tenants: TopTenant[] | undefined;
  isLoading: boolean;
};

function TenantRow({
  tenant,
  index,
  maxUsers,
}: {
  tenant: TopTenant;
  index: number;
  maxUsers: number;
}) {
  const progressWidth = maxUsers > 0 ? (tenant.usersCount / maxUsers) * 100 : 0;

  return (
    <div className="group relative">
      <div
        className="absolute inset-0 rounded-lg bg-emerald-500/[0.03] transition-all duration-300"
        style={{ width: `${progressWidth}%` }}
      />
      <div className="relative flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/40">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-xs font-medium text-muted-foreground">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {tenant.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {tenant.slug}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5">
            <Users className="size-3.5 text-muted-foreground" strokeWidth={2} />
            <span className="text-xs font-medium tabular-nums">
              {tenant.usersCount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5">
            <BookOpen className="size-3.5 text-primary/60" strokeWidth={2} />
            <span className="text-xs font-medium tabular-nums text-primary/80">
              {tenant.coursesCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3">
          <Skeleton className="size-6 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopTenantsTable({ tenants, isLoading }: TopTenantsTableProps) {
  const { t } = useTranslation();
  const maxUsers =
    tenants && tenants.length > 0
      ? Math.max(...tenants.map((t) => t.usersCount))
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Building2 className="size-4 text-emerald-600" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {t("backoffice.dashboard.topTenants")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("backoffice.dashboard.byUsers")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !tenants || tenants.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-xl bg-muted/30">
          <div className="text-center">
            <Building2 className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("backoffice.dashboard.noTenantsYet")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {tenants.map((tenant, index) => (
            <TenantRow
              key={tenant.id}
              tenant={tenant}
              index={index}
              maxUsers={maxUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
