import * as React from "react";
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME_LEFT = "sidebar_left_state";
const SIDEBAR_COOKIE_NAME_RIGHT = "sidebar_right_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "24rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";

type SidebarState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggle: () => void;
  state: "expanded" | "collapsed";
};

type DualSidebarContextProps = {
  left: SidebarState;
  right: SidebarState;
  isMobile: boolean;
};

const DualSidebarContext = React.createContext<DualSidebarContextProps | null>(
  null
);

function useDualSidebar() {
  const context = React.useContext(DualSidebarContext);
  if (!context) {
    throw new Error(
      "useDualSidebar must be used within a DualSidebarProvider."
    );
  }
  return context;
}

function DualSidebarProvider({
  defaultLeftOpen = true,
  defaultRightOpen = false,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultLeftOpen?: boolean;
  defaultRightOpen?: boolean;
}) {
  const isMobile = useIsMobile();

  const [leftOpen, setLeftOpenState] = React.useState(defaultLeftOpen);
  const [leftOpenMobile, setLeftOpenMobile] = React.useState(false);

  const [rightOpen, setRightOpenState] = React.useState(defaultRightOpen);
  const [rightOpenMobile, setRightOpenMobile] = React.useState(false);

  const setLeftOpen = React.useCallback((value: boolean) => {
    setLeftOpenState(value);
    document.cookie = `${SIDEBAR_COOKIE_NAME_LEFT}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, []);

  const setRightOpen = React.useCallback((value: boolean) => {
    setRightOpenState(value);
    document.cookie = `${SIDEBAR_COOKIE_NAME_RIGHT}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, []);

  const toggleLeft = React.useCallback(() => {
    if (isMobile) {
      setLeftOpenMobile((prev) => !prev);
    } else {
      setLeftOpen(!leftOpen);
    }
  }, [isMobile, leftOpen, setLeftOpen]);

  const toggleRight = React.useCallback(() => {
    if (isMobile) {
      setRightOpenMobile((prev) => !prev);
    } else {
      setRightOpen(!rightOpen);
    }
  }, [isMobile, rightOpen, setRightOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (event.shiftKey) {
          toggleRight();
        } else {
          toggleLeft();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleLeft, toggleRight]);

  const left: SidebarState = React.useMemo(
    () => ({
      open: leftOpen,
      setOpen: setLeftOpen,
      openMobile: leftOpenMobile,
      setOpenMobile: setLeftOpenMobile,
      toggle: toggleLeft,
      state: leftOpen ? "expanded" : "collapsed",
    }),
    [leftOpen, setLeftOpen, leftOpenMobile, toggleLeft]
  );

  const right: SidebarState = React.useMemo(
    () => ({
      open: rightOpen,
      setOpen: setRightOpen,
      openMobile: rightOpenMobile,
      setOpenMobile: setRightOpenMobile,
      toggle: toggleRight,
      state: rightOpen ? "expanded" : "collapsed",
    }),
    [rightOpen, setRightOpen, rightOpenMobile, toggleRight]
  );

  const contextValue = React.useMemo<DualSidebarContextProps>(
    () => ({ left, right, isMobile }),
    [left, right, isMobile]
  );

  return (
    <DualSidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="dual-sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
          className={cn("flex h-screen w-full flex-col overflow-hidden", className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </DualSidebarContext.Provider>
  );
}

function DualSidebar({
  side,
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side: "left" | "right";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { left, right, isMobile } = useDualSidebar();
  const sidebarState = side === "left" ? left : right;

  if (collapsible === "none") {
    return (
      <div
        data-slot="dual-sidebar"
        data-side={side}
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet
        open={sidebarState.openMobile}
        onOpenChange={sidebarState.setOpenMobile}
        {...props}
      >
        <SheetContent
          data-sidebar="sidebar"
          data-slot="dual-sidebar"
          data-mobile="true"
          data-side={side}
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "group peer text-sidebar-foreground hidden h-full shrink-0 flex-col md:flex",
        "bg-sidebar w-(--sidebar-width) transition-[width] duration-200 ease-linear",
        "data-[collapsible=offcanvas]:w-0 data-[collapsible=offcanvas]:overflow-hidden",
        side === "left" ? "border-r" : "border-l",
        className
      )}
      data-state={sidebarState.state}
      data-collapsible={sidebarState.state === "collapsed" ? collapsible : ""}
      data-side={side}
      data-slot="dual-sidebar"
      {...props}
    >
      {children}
    </aside>
  );
}

function DualSidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="dual-sidebar-inset"
      className={cn("bg-background relative flex w-full flex-1 flex-col", className)}
      {...props}
    />
  );
}

function DualSidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dual-sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DualSidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dual-sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DualSidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dual-sidebar-content"
      data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)}
      {...props}
    />
  );
}

function DualSidebarTrigger({
  side,
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { side: "left" | "right" }) {
  const { t } = useTranslation();
  const { left, right } = useDualSidebar();
  const sidebarState = side === "left" ? left : right;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-sidebar="trigger"
          data-slot="dual-sidebar-trigger"
          data-side={side}
          variant="ghost"
          size="icon"
          className={cn("size-7", className)}
          onClick={(event) => {
            onClick?.(event);
            sidebarState.toggle();
          }}
          {...props}
        >
          {side === "left" ? (
            <PanelLeftIcon className="size-4" />
          ) : (
            <PanelRightIcon className="size-4" />
          )}
          <span className="sr-only">{t("common.toggleSidebar")}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side === "left" ? "right" : "left"}>
        {t("common.toggleSidebar")}
      </TooltipContent>
    </Tooltip>
  );
}

function DualSidebarRail({
  side,
  className,
  ...props
}: React.ComponentProps<"button"> & { side: "left" | "right" }) {
  const { t } = useTranslation();
  const { left, right } = useDualSidebar();
  const sidebarState = side === "left" ? left : right;

  return (
    <button
      data-sidebar="rail"
      data-slot="dual-sidebar-rail"
      data-side={side}
      aria-label={t("common.toggleSidebar")}
      tabIndex={-1}
      onClick={sidebarState.toggle}
      title={t("common.toggleSidebar")}
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        side === "left"
          ? "-right-4 cursor-w-resize [[data-state=collapsed]_&]:cursor-e-resize"
          : "-left-4 cursor-e-resize [[data-state=collapsed]_&]:cursor-w-resize",
        className
      )}
      {...props}
    />
  );
}

function SidebarToggleTab({
  side,
  icon,
  label,
  showOnMobile = false,
  className,
}: {
  side: "left" | "right";
  icon: React.ReactNode;
  label?: string;
  showOnMobile?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { left, right, isMobile } = useDualSidebar();
  const sidebarState = side === "left" ? left : right;

  if ((isMobile && !showOnMobile) || sidebarState.open) return null;

  return (
    <button
      onClick={sidebarState.toggle}
      aria-label={t("common.toggleSidebar")}
      className={cn(
        "fixed top-1/2 z-30 -translate-y-1/2",
        "flex flex-col items-center justify-center gap-1",
        "bg-background border shadow-lg",
        "transition-all duration-200",
        "hover:bg-accent",
        side === "left"
          ? "left-0 rounded-r-xl border-l-0 py-4 pr-2 pl-1"
          : "right-0 rounded-l-xl border-r-0 py-4 pl-2 pr-1",
        className
      )}
    >
      {icon}
      {label && (
        <span
          className="text-muted-foreground text-[10px] font-medium tracking-wide"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export {
  DualSidebarProvider,
  DualSidebar,
  DualSidebarInset,
  DualSidebarHeader,
  DualSidebarFooter,
  DualSidebarContent,
  DualSidebarTrigger,
  DualSidebarRail,
  SidebarToggleTab,
  useDualSidebar,
};
