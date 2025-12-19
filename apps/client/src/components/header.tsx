import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import { ModeToggle } from "@/components/ui/theme-toggle";
import {
  canAccessBackoffice,
  canAccessTenantDashboard,
} from "@learnbase/core";
import { useGetProfile } from "@/services/profile/queries";
import { useLogout } from "@/services/auth/mutations";

export function Header() {
  const { t } = useTranslation();
  const { data: profileData, isLoading } = useGetProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const navigate = useNavigate();

  const user = profileData?.user;
  const tenant = profileData?.tenant;

  // Preload avatar image to avoid flash when switching from skeleton to avatar
  useEffect(() => {
    if (user?.avatar) {
      const img = new Image();
      img.src = user.avatar;
    }
  }, [user?.avatar]);

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold">
          Learnbase
        </Link>

        <nav className="flex items-center gap-2">
          <ModeToggle />
          {isLoading ? (
            <Skeleton className="size-8 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={user.avatar || ""}
                      alt={t("header.userAvatar")}
                    />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("header.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User />
                    {t("header.profile")}
                  </Link>
                </DropdownMenuItem>
                {canAccessTenantDashboard(user.role) && tenant && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/$tenantSlug"
                      params={{ tenantSlug: tenant.slug }}
                    >
                      <LayoutDashboard />
                      {t("dashboard.sidebar.adminPanel")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {canAccessBackoffice(user.role) && (
                  <DropdownMenuItem asChild>
                    <Link to="/backoffice">
                      <Shield />
                      {t("backoffice.title")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isLoggingOut}
                  onClick={() => {
                    logout(undefined, {
                      onSuccess: () => navigate({ to: "/login" }),
                    });
                  }}
                >
                  <LogOut />
                  {t("common.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">{t("common.logIn")}</Button>
              </Link>
              <Link to="/signup">
                <Button>{t("common.signUp")}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
