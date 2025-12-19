import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus, UserPlus, GraduationCap, Settings } from "lucide-react";
import { Card, CardContent } from "@learnbase/ui";

type QuickActionsProps = {
  tenantSlug: string;
};

export function QuickActions({ tenantSlug }: QuickActionsProps) {
  const { t } = useTranslation();

  const actions = [
    {
      label: t("dashboard.home.quickActions.createCourse"),
      href: `/${tenantSlug}/content/courses`,
      icon: Plus,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: t("dashboard.home.quickActions.inviteStudents"),
      href: `/${tenantSlug}/management/users`,
      icon: UserPlus,
      color: "text-green-500 bg-green-500/10",
    },
    {
      label: t("dashboard.home.quickActions.viewEnrollments"),
      href: `/${tenantSlug}/management/enrollments`,
      icon: GraduationCap,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      label: t("dashboard.home.quickActions.siteSettings"),
      href: `/${tenantSlug}/site/configuration`,
      icon: Settings,
      color: "text-orange-500 bg-orange-500/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Link key={action.href} to={action.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <div className={`rounded-full p-2.5 ${action.color}`}>
                <action.icon className="size-5" />
              </div>
              <span className="text-sm font-medium text-center">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
