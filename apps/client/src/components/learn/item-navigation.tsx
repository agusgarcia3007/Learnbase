import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearnModule } from "@/services/learn";

type ItemNavigationProps = {
  modules: LearnModule[];
  currentItemId: string | null;
  onNavigate: (itemId: string) => void;
};

export function ItemNavigation({
  modules,
  currentItemId,
  onNavigate,
}: ItemNavigationProps) {
  const { t } = useTranslation();

  const { prevItem, nextItem, currentIndex, totalItems } = useMemo(() => {
    const allItems = modules.flatMap((m) => m.items);
    const currentIdx = allItems.findIndex((item) => item.id === currentItemId);

    return {
      prevItem: currentIdx > 0 ? allItems[currentIdx - 1] : null,
      nextItem: currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null,
      currentIndex: currentIdx + 1,
      totalItems: allItems.length,
    };
  }, [modules, currentItemId]);

  if (!currentItemId) return null;

  return (
    <div className="border-t bg-background/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => prevItem && onNavigate(prevItem.id)}
          disabled={!prevItem}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{t("learn.previous")}</span>
        </Button>

        <span className="text-muted-foreground text-sm tabular-nums">
          {currentIndex} / {totalItems}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => nextItem && onNavigate(nextItem.id)}
          disabled={!nextItem}
          className="gap-1.5"
        >
          <span className="hidden sm:inline">{t("learn.next")}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
