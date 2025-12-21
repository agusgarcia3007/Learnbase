import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Shield, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useGetProfile } from "@/services/profile/queries";
import { useLogout } from "@/services/auth/mutations";
import { cn } from "@/lib/utils";
import { canAccessBackoffice, canAccessTenantDashboard } from "@learnbase/core";
import { siteData } from "@/lib/constants";
import { LearnbaseLogo } from "./logo";

const navLinks = [
  { key: "features", href: "#features" },
  { key: "pricing", href: "#pricing" },
  { key: "faq", href: "#faq" },
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

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

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentWidth(entry.contentRect.width + 24);
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 pt-4">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            width: hasScrolled && contentWidth > 0 ? contentWidth : "100%",
          }}
          transition={{
            opacity: { duration: 0.5, delay: 0.2 },
            y: { duration: 0.5, delay: 0.2 },
            width: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
          }}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-2",
            hasScrolled
              ? "border-border/50 bg-background/70 shadow-lg shadow-black/5 backdrop-blur-md"
              : "justify-between border-transparent bg-transparent shadow-none"
          )}
        >
          <div ref={contentRef} className="flex w-full items-center justify-between">
            <Link
              to="/"
              search={{ campus: undefined }}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-foreground/5"
            >
              <LearnbaseLogo className="h-6 w-6" />
              <span className="text-sm font-semibold text-foreground">
                {siteData.name}
              </span>
            </Link>

            <div className="flex items-center gap-2">
            <div
              className={cn(
                "mx-1 hidden h-4 w-px md:block transition-opacity duration-300",
                hasScrolled ? "bg-border/50 opacity-100" : "opacity-0"
              )}
            />

            <div className="hidden items-center md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  {t(`landing.nav.${link.key}`)}
                </a>
              ))}
            </div>

            <div
              className={cn(
                "mx-1 hidden h-4 w-px md:block transition-opacity duration-300",
                hasScrolled ? "bg-border/50 opacity-100" : "opacity-0"
              )}
            />

            <div className="hidden items-center gap-1 md:flex">
            <LanguageToggle variant="ghost" className="rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" />
            <ModeToggle variant="ghost" className="rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 rounded-full hover:bg-foreground/5">
                    <Avatar className="size-7">
                      <AvatarImage
                        src={user.avatar || ""}
                        alt={t("header.userAvatar")}
                      />
                      <AvatarFallback className="border-0 bg-primary/10 text-xs text-primary">
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
                    className="h-8 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  >
                    {t("landing.nav.login")}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="h-8 rounded-full px-4 text-sm font-medium"
                  >
                    {t("landing.nav.getStarted")}
                  </Button>
                </Link>
              </>
            )}
            </div>

            <div className="flex items-center gap-1 md:hidden">
            <LanguageToggle variant="ghost" className="rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" />
            <ModeToggle variant="ghost" className="rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {isMenuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </button>
            </div>
          </div>
        </motion.nav>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mx-auto mt-2 max-w-md px-4 md:hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/80 shadow-lg backdrop-blur-md">
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t(`landing.nav.${link.key}`)}
                  </a>
                ))}

                <div className="my-2 h-px bg-border/50" />

                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("header.profile")}
                    </Link>
                    {canAccessTenantDashboard(user.role) && tenant && (
                      <Link
                        to="/$tenantSlug"
                        params={{ tenantSlug: tenant.slug }}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
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
                      className="rounded-xl px-4 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    >
                      {t("common.logOut")}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full rounded-xl border-border/50">
                        {t("landing.nav.login")}
                      </Button>
                    </Link>
                    <Link to="/signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="w-full rounded-xl">
                        {t("landing.nav.getStarted")}
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
