import { useTranslation } from "react-i18next";
import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  DualSidebar,
  DualSidebarHeader,
  DualSidebarContent,
  DualSidebarFooter,
  SidebarToggleTab,
  useDualSidebar,
} from "@/components/ui/dual-sidebar";
import { cn } from "@/lib/utils";

export function AIChatSidebar() {
  const { t } = useTranslation();
  const { right, isMobile } = useDualSidebar();

  const handleSubmit = () => {
    // TODO: Implement chat submission
  };

  return (
    <>
      <DualSidebar side="right" collapsible="offcanvas">
        <DualSidebarHeader className="from-primary/5 to-primary/10 border-b bg-gradient-to-r">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="text-primary size-5" />
                <span className="bg-primary absolute -top-0.5 -right-0.5 size-2 animate-pulse rounded-full" />
              </div>
              <span className="whitespace-nowrap font-semibold">
                {t("learn.aiAssistant")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7", isMobile && "hidden")}
              onClick={right.toggle}
              aria-label={t("learn.closeAIChat")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </DualSidebarHeader>

        <DualSidebarContent>
          <ScrollArea className="flex-1">
            <div className="flex h-full min-h-[200px] items-center justify-center p-4">
              <p className="text-muted-foreground text-center text-sm">
                {t("learn.aiChatEmpty")}
              </p>
            </div>
          </ScrollArea>
        </DualSidebarContent>

        <DualSidebarFooter className="border-t">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              placeholder={t("learn.aiChatPlaceholder")}
              className="min-h-12"
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </DualSidebarFooter>
      </DualSidebar>

      <SidebarToggleTab
        side="right"
        icon={<Sparkles className="text-primary size-4" />}
        label="AI"
      />
    </>
  );
}
