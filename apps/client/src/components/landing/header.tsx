import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Shield, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@learnbase/ui";
import { Button } from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useGetProfile } from "@/services/profile/queries";
import { useLogout } from "@/services/auth/mutations";
import { cn } from "@/lib/utils";
import { canAccessBackoffice, canAccessTenantDashboard } from "@learnbase/core";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

const navLinks: Array<{ key: string; href: string; isRoute?: boolean }> = [
  { key: "features", href: "#features" },
  { key: "pricing", href: "#pricing" },
  { key: "faq", href: "#faq" },
  { key: "roadmap", href: "/features", isRoute: true },
];

export function LandingHeader() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        hasScrolled
          ? "border-b border-[var(--landing-border)] bg-[var(--landing-card)]/90 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link to="/" search={{ campus: undefined }} className="flex items-center gap-2.5">
            <LearnbaseLogo className="h-7 w-7" />
            <span className="text-base font-semibold text-[var(--landing-text)]">
              {siteData.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.key}
                  to={link.href}
                  className="px-4 py-2 text-sm font-medium text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]"
                >
                  {t(`landing.nav.${link.key}`)}
                </Link>
              ) : (
                <a
                  key={link.key}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]"
                >
                  {t(`landing.nav.${link.key}`)}
                </a>
              )
            )}
          </nav>
        </div>

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
                    <AvatarFallback className="bg-[var(--landing-accent-light)] text-[var(--landing-accent)]">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-sm font-medium text-[var(--landing-text-muted)] hover:text-[var(--landing-text)]"
                >
                  {t("landing.nav.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="h-9 rounded-full px-5 text-sm font-medium"
                >
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--landing-text-muted)] transition-colors hover:bg-[var(--landing-bg-alt)] hover:text-[var(--landing-text)]"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute left-0 right-0 top-16 border-b border-[var(--landing-border)] bg-[var(--landing-card)] md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-2 border-b border-[var(--landing-border)] pb-4">
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.key}
                      to={link.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-text-muted)] transition-colors hover:bg-[var(--landing-bg-alt)] hover:text-[var(--landing-text)]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t(`landing.nav.${link.key}`)}
                    </Link>
                  ) : (
                    <a
                      key={link.key}
                      href={link.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-text-muted)] transition-colors hover:bg-[var(--landing-bg-alt)] hover:text-[var(--landing-text)]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t(`landing.nav.${link.key}`)}
                    </a>
                  )
                )}
              </div>
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-text-muted)] hover:bg-[var(--landing-bg-alt)] hover:text-[var(--landing-text)]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("header.profile")}
                  </Link>
                  {canAccessTenantDashboard(user.role) && tenant && (
                    <Link
                      to="/$tenantSlug"
                      params={{ tenantSlug: tenant.slug }}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-text-muted)] hover:bg-[var(--landing-bg-alt)] hover:text-[var(--landing-text)]"
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
                    className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--landing-text-muted)] hover:bg-[var(--landing-bg-alt)] hover:text-[var(--landing-text)]"
                  >
                    {t("common.logOut")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-[var(--landing-border)]">
                      {t("landing.nav.login")}
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      {t("landing.nav.getStarted")}
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
