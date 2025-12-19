import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@learnbase/ui";
import type { ItemIdWithModule } from "@/services/learn";

type ItemNavigationProps = {
  itemIds: ItemIdWithModule[];
  currentItemId: string | null;
  onNavigate: (itemId: string) => void;
};

export function ItemNavigation({
  itemIds,
  currentItemId,
  onNavigate,
}: ItemNavigationProps) {
  const { t } = useTranslation();

  const { prevItemId, nextItemId, currentIndex, totalItems } = useMemo(() => {
    const currentIdx = itemIds.findIndex((item) => item.id === currentItemId);

    return {
      prevItemId: currentIdx > 0 ? itemIds[currentIdx - 1]?.id : null,
      nextItemId:
        currentIdx < itemIds.length - 1 ? itemIds[currentIdx + 1]?.id : null,
      currentIndex: currentIdx + 1,
      totalItems: itemIds.length,
    };
  }, [itemIds, currentItemId]);

  if (!currentItemId || itemIds.length === 0) return null;

  return (
    <div className="border-t bg-background/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => prevItemId && onNavigate(prevItemId)}
          disabled={!prevItemId}
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
          onClick={() => nextItemId && onNavigate(nextItemId)}
          disabled={!nextItemId}
          className="gap-1.5"
        >
          <span className="hidden sm:inline">{t("learn.next")}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
