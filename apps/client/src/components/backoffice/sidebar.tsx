import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  Award,
  BookOpen,
  Building2,
  ChevronsUpDown,
  HardDrive,
  Home,
  LogOut,
  Mail,
  Shield,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useLogout } from "@/services/auth/mutations";
import type { User } from "@/services/profile/service";

type BackofficeSidebarProps = {
  user: User;
};

export function BackofficeSidebar({ user }: BackofficeSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { mutate: logout, isPending } = useLogout();
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [currentPath, setOpenMobile]);

  const navMain = useMemo(
    () => [
      {
        title: t("backoffice.sidebar.overview"),
        items: [
          {
            title: t("backoffice.sidebar.home"),
            url: "/backoffice",
            icon: Home,
            isActive: currentPath === "/backoffice",
          },
        ],
      },
      {
        title: t("backoffice.sidebar.management"),
        items: [
          {
            title: t("backoffice.sidebar.users"),
            url: "/backoffice/users",
            icon: Users,
            isActive: currentPath === "/backoffice/users",
          },
          {
            title: t("backoffice.sidebar.tenants"),
            url: "/backoffice/tenants",
            icon: Building2,
            isActive: currentPath === "/backoffice/tenants",
          },
          {
            title: t("backoffice.sidebar.waitlist"),
            url: "/backoffice/waitlist",
            icon: Mail,
            isActive: currentPath === "/backoffice/waitlist",
          },
        ],
      },
      {
        title: t("backoffice.sidebar.storage"),
        items: [
          {
            title: t("backoffice.sidebar.fileExplorer"),
            url: "/backoffice/files",
            icon: HardDrive,
            isActive: currentPath.startsWith("/backoffice/files"),
          },
        ],
      },
      {
        title: t("backoffice.sidebar.learning"),
        items: [
          {
            title: t("backoffice.sidebar.enrollments"),
            url: "/backoffice/enrollments",
            icon: BookOpen,
            isActive: currentPath === "/backoffice/enrollments",
          },
          {
            title: t("backoffice.sidebar.certificates"),
            url: "/backoffice/certificates",
            icon: Award,
            isActive: currentPath === "/backoffice/certificates",
          },
        ],
      },
    ],
    [currentPath, t]
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/backoffice">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Shield className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">
                    {t("backoffice.title")}
                  </span>
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
                      <Link to={item.url}>
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
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <Home />
                    {t("common.backToHome")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} disabled={isPending}>
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
