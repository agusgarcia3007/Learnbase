import { useTranslation } from "react-i18next";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

type AIChatSidebarProps = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function AIChatSidebar({
  collapsed = true,
  onToggleCollapsed,
}: AIChatSidebarProps) {
  const { t } = useTranslation();

  const handleSubmit = () => {
    // TODO: Implement chat submission
  };

  if (collapsed) {
    return (
      <div className="hidden border-l p-2 lg:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapsed}
          aria-label={t("learn.openAIChat")}
          className="text-primary"
        >
          <Sparkles className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "bg-muted/30 hidden w-96 flex-col border-l transition-all duration-300 lg:flex"
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-5" />
          <span className="text-sm font-semibold">{t("learn.aiAssistant")}</span>
        </div>
        {onToggleCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleCollapsed}
            aria-label={t("learn.closeAIChat")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-muted-foreground text-center text-sm">
            {t("learn.aiChatEmpty")}
          </p>
        </div>
      </ScrollArea>

      <div className="border-t p-4">
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
      </div>
    </aside>
  );
}
