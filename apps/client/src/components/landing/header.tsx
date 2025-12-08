import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Shield, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useGetProfile } from "@/services/profile/queries";
import { useLogout } from "@/services/auth/mutations";
import { cn } from "@/lib/utils";
import { LearnbaseLogo } from "./logo";

export function LandingHeader() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: profileData } = useGetProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const navigate = useNavigate();

  const user = profileData?.user;
  const tenant = profileData?.tenant;

  useEffect(() => {
    if (user?.avatar) {
      const img = new Image();
      img.src = user.avatar;
    }
  }, [user?.avatar]);

  const navLinks = [
    { href: "#features", label: t("landing.nav.features") },
    { href: "#pricing", label: t("landing.nav.pricing") },
    { href: "#testimonials", label: t("landing.nav.testimonials") },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LearnbaseLogo className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Learnbase
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          {user ? (
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
                {(user.role === "owner" || user.role === "superadmin") &&
                  tenant && (
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
                {user.role === "superadmin" && (
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {t("landing.nav.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="h-8 rounded-md px-4 text-[13px] font-medium">
                  {t("landing.nav.getStarted")}
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "absolute left-0 right-0 top-14 border-b border-border bg-background p-6 md:hidden",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {user ? (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <Link
                to="/profile"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("header.profile")}
              </Link>
              {(user.role === "owner" || user.role === "superadmin") &&
                tenant && (
                  <Link
                    to="/$tenantSlug"
                    params={{ tenantSlug: tenant.slug }}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("dashboard.sidebar.adminPanel")}
                  </Link>
                )}
              <button
                onClick={() => {
                  logout(undefined, {
                    onSuccess: () => navigate({ to: "/login" }),
                  });
                  setIsMenuOpen(false);
                }}
                disabled={isLoggingOut}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t("common.logOut")}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 border-t border-border pt-4">
              <Link to="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  {t("landing.nav.login")}
                </Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button size="sm" className="w-full text-sm">
                  {t("landing.nav.getStarted")}
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
