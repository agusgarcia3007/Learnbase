import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Shield, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { canAccessBackoffice, canAccessTenantDashboard } from "@/lib/permissions";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

const navLinks = [
  { key: "features", href: "#features" },
  { key: "pricing", href: "#pricing" },
  { key: "faq", href: "#faq" },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group relative px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <span className="absolute bottom-1 left-3 right-3 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
    </a>
  );
}

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
    <motion.header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        hasScrolled
          ? "border-b border-border/50 bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link to="/" search={{ campus: undefined }} className="flex items-center gap-2.5">
            <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
              <LearnbaseLogo className="h-8 w-8" />
            </motion.div>
            <span className="text-base font-semibold tracking-tight">
              {siteData.name}
            </span>
          </Link>

          <nav className="hidden items-center md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.key} href={link.href}>
                {t(`landing.nav.${link.key}`)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                    <AvatarImage
                      src={user.avatar || ""}
                      alt={t("header.userAvatar")}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
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
                  className="h-9 px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("landing.nav.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="h-9 rounded-full px-5 text-sm font-medium shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/30"
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
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
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
            className="absolute left-0 right-0 top-16 border-b border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
                {navLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t(`landing.nav.${link.key}`)}
                  </a>
                ))}
              </div>
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("header.profile")}
                  </Link>
                  {canAccessTenantDashboard(user.role) && tenant && (
                    <Link
                      to="/$tenantSlug"
                      params={{ tenantSlug: tenant.slug }}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    className="rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {t("common.logOut")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
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
    </motion.header>
  );
}
