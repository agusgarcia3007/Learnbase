import { Link } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { CartSheet } from "@/components/campus/cart-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/format";
import type { CampusTenant } from "@/services/campus/service";
import { useGetProfile } from "@/services/profile/queries";
import { useLogout } from "@/services/auth/mutations";

type CampusHeaderProps = {
  tenant: CampusTenant;
};

export function CampusHeader({ tenant }: CampusHeaderProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: profileData } = useGetProfile();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const user = profileData?.user;
  const isAuthenticated = !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            {tenant.logo ? (
              <Image
                src={tenant.logo}
                alt={tenant.name}
                width={36}
                height={36}
                className="size-9 rounded-lg object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="size-5 text-primary-foreground" />
              </div>
            )}
            {tenant.showHeaderName && (
              <span className="text-lg font-semibold tracking-tight">{tenant.name}</span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                {t("campus.navigation.home")}
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                {t("campus.navigation.courses")}
              </Button>
            </Link>
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          <CartSheet />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-9 rounded-full">
                  <Avatar className="size-9">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 size-4" />
                    {t("header.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  {t("common.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t("campus.navigation.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">{t("campus.navigation.signup")}</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartSheet />
          <Button
            variant="ghost"
            mode="icon"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {t("campus.navigation.home")}
              </Button>
            </Link>
            <Link to="/courses" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {t("campus.navigation.courses")}
              </Button>
            </Link>
            <div className="flex items-center justify-center py-2">
              <ModeToggle />
            </div>
            <div className="my-2 border-t border-border/40" />
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="size-10">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="mr-2 size-4" />
                    {t("header.profile")}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 size-4" />
                  {t("common.logOut")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t("campus.navigation.login")}
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">{t("campus.navigation.signup")}</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
