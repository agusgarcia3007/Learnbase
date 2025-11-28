import { Link, useParams, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronsUpDown,
  GraduationCap,
  Home,
  Layers,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useLogout } from "@/services/auth/mutations";
import type { User } from "@/services/profile/service";
import type { Tenant } from "@/services/tenants/service";

type DashboardSidebarProps = {
  tenant: Tenant;
  user: User;
};

export function DashboardSidebar({ tenant, user }: DashboardSidebarProps) {
  const { tenantSlug } = useParams({ strict: false });
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { mutate: logout } = useLogout();
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navMain = [
    {
      title: t("dashboard.sidebar.overview"),
      items: [
        {
          title: t("dashboard.sidebar.home"),
          url: `/${tenantSlug}`,
          icon: Home,
          isActive: currentPath === `/${tenantSlug}`,
        },
      ],
    },
    {
      title: t("dashboard.sidebar.content"),
      items: [
        {
          title: t("dashboard.sidebar.courses"),
          url: `/${tenantSlug}/content/courses`,
          icon: BookOpen,
          isActive: currentPath.endsWith("/content/courses"),
        },
        {
          title: t("dashboard.sidebar.modules"),
          url: `/${tenantSlug}/content/modules`,
          icon: Layers,
          isActive: currentPath.endsWith("/content/modules"),
        },
        {
          title: t("dashboard.sidebar.classes"),
          url: `/${tenantSlug}/content/classes`,
          icon: GraduationCap,
          isActive: currentPath.endsWith("/content/classes"),
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/$tenantSlug"
                params={{ tenantSlug: tenantSlug as string }}
              >
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{tenant.name}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link
                        to={item.url}
                        params={{ tenantSlug: tenantSlug as string }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      src={user.avatar ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut />
                  {t("common.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
