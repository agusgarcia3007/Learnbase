import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  FileText,
  FolderTree,
  GraduationCap,
  Home,
  Landmark,
  Layers,
  ListChecks,
  LogOut,
  Package,
  Palette,
  Settings,
  Shield,
  UserCircle,
  Users,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
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
  const { mutate: logout, isPending } = useLogout();
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [currentPath, setOpenMobile]);

  const moduleItemsSubItems = useMemo(
    () => [
      {
        title: t("dashboard.sidebar.videos"),
        url: `/${tenantSlug}/content/videos`,
        icon: Video,
        isActive: currentPath.endsWith("/content/videos"),
      },
      {
        title: t("dashboard.sidebar.documents"),
        url: `/${tenantSlug}/content/documents`,
        icon: FileText,
        isActive: currentPath.endsWith("/content/documents"),
      },
      {
        title: t("dashboard.sidebar.quizzes"),
        url: `/${tenantSlug}/content/quizzes`,
        icon: ListChecks,
        isActive: currentPath.endsWith("/content/quizzes"),
      },
    ],
    [tenantSlug, currentPath, t]
  );

  const moduleItemsIsActive = moduleItemsSubItems.some((item) => item.isActive);

  const navMain = useMemo(
    () => [
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
            title: t("dashboard.sidebar.moduleItems"),
            icon: Package,
            isCollapsible: true,
            subItems: moduleItemsSubItems,
            isActive: moduleItemsIsActive,
          },
          {
            title: t("dashboard.sidebar.categories"),
            url: `/${tenantSlug}/content/categories`,
            icon: FolderTree,
            isActive: currentPath.endsWith("/content/categories"),
          },
          {
            title: t("dashboard.sidebar.instructors"),
            url: `/${tenantSlug}/content/instructors`,
            icon: UserCircle,
            isActive: currentPath.endsWith("/content/instructors"),
          },
        ],
      },
      {
        title: t("dashboard.sidebar.management"),
        items: [
          {
            title: t("dashboard.sidebar.users"),
            url: `/${tenantSlug}/management/users`,
            icon: Users,
            isActive: currentPath.endsWith("/management/users"),
          },
          {
            title: t("dashboard.sidebar.enrollments"),
            url: `/${tenantSlug}/management/enrollments`,
            icon: GraduationCap,
            isActive: currentPath.endsWith("/management/enrollments"),
          },
        ],
      },
      {
        title: t("dashboard.sidebar.mySite"),
        items: [
          {
            title: t("dashboard.sidebar.configuration"),
            url: `/${tenantSlug}/site/configuration`,
            icon: Settings,
            isActive: currentPath.includes("/site/configuration"),
          },
          {
            title: t("dashboard.sidebar.customization"),
            url: `/${tenantSlug}/site/customization`,
            icon: Palette,
            isActive: currentPath.includes("/site/customization"),
          },
          {
            title: t("dashboard.sidebar.aiAssistant"),
            url: `/${tenantSlug}/site/ai`,
            icon: Bot,
            isActive: currentPath.includes("/site/ai"),
          },
          {
            title: t("dashboard.sidebar.billing"),
            url: `/${tenantSlug}/billing`,
            icon: CreditCard,
            isActive: currentPath.includes("/billing"),
          },
          {
            title: t("dashboard.sidebar.payments"),
            url: `/${tenantSlug}/connect`,
            icon: Landmark,
            isActive: currentPath.includes("/connect"),
          },
        ],
      },
    ],
    [tenantSlug, currentPath, t, moduleItemsSubItems, moduleItemsIsActive]
  );

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
                {tenant.logo ? (
                  <img
                    src={tenant.logo}
                    alt={tenant.name}
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                )}
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
                {group.items.map((item) =>
                  "isCollapsible" in item && item.isCollapsible ? (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={item.isActive}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={subItem.isActive}
                                >
                                  <Link
                                    to={subItem.url}
                                    params={{
                                      tenantSlug: tenantSlug as string,
                                    }}
                                  >
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : "url" in item ? (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={item.isActive}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null
                )}
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
                  <Link to="/" search={{ campus: undefined }}>
                    <Home />
                    {t("common.backToHome")}
                  </Link>
                </DropdownMenuItem>
                {user.role === "superadmin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/backoffice">
                      <Shield />
                      {t("common.backoffice")}
                    </Link>
                  </DropdownMenuItem>
                )}
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
