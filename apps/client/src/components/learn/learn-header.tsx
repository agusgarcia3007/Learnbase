import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@learnbase/ui";
import { cn } from "@/lib/utils";

type LearnHeaderProps = {
  courseTitle: string;
  courseSlug: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
};

export function LearnHeader({
  courseTitle,
  courseSlug,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenDrawer,
}: LearnHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "bg-background/80 supports-[backdrop-filter]:bg-background/60",
        "sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b px-4",
        "backdrop-blur-xl"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex"
        onClick={onToggleSidebar}
        aria-label={t("learn.toggleSidebar")}
      >
        {sidebarCollapsed ? (
          <PanelLeft className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenDrawer}
        aria-label={t("learn.openMenu")}
      >
        <Menu className="size-5" />
      </Button>

      <div className="h-5 w-px bg-border" />

      <Link
        to="/courses/$courseSlug"
        params={{ courseSlug }}
        search={{ campus: undefined }}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          "flex items-center gap-1.5 text-sm transition-colors"
        )}
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">{t("learn.backToCourse")}</span>
      </Link>

      <div className="flex-1" />

      <h1 className="text-foreground truncate text-sm font-medium">
        {courseTitle}
      </h1>
    </header>
  );
}
