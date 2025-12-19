import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, HelpCircle, Search, Sparkles, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/kibo-ui/kanban";
import {
  useGetModule,
  useCreateModule,
  useUpdateModule,
  useUpdateModuleItems,
} from "@/services/modules";
import type { Module, ContentType } from "@/services/modules";
import { useGenerateModule } from "@/services/ai";
import { useVideosInfinite } from "@/services/videos";
import { useDocumentsInfinite } from "@/services/documents";
import { useQuizzesInfinite } from "@/services/quizzes";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type FormData = z.infer<typeof schema>;

type ContentItem = {
  id: string;
  contentType: ContentType;
  title: string;
  duration?: number;
};

type KanbanItem = {
  id: string;
  name: string;
  column: string;
  contentType: ContentType;
  contentId: string;
  content: ContentItem;
};

type ModuleEditorProps = {
  module?: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const COLUMNS = [
  { id: "available", name: "available" },
  { id: "module", name: "module" },
];

function ContentTypeIcon({ type }: { type: ContentType }) {
  switch (type) {
    case "video":
      return <Video className="size-3" />;
    case "document":
      return <FileText className="size-3" />;
    case "quiz":
      return <HelpCircle className="size-3" />;
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ContentCardContent({ content }: { content: ContentItem }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm leading-tight">{content.title}</p>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" size="sm" className="gap-1">
          <ContentTypeIcon type={content.contentType} />
          {t(`content.types.${content.contentType}`)}
        </Badge>
        {content.duration && content.duration > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(content.duration)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ModuleEditor({
  module,
  open,
  onOpenChange,
}: ModuleEditorProps) {
  const { t } = useTranslation();
  const isEditing = !!module;

  const { data: moduleData, isLoading: isLoadingModule } = useGetModule(module?.id ?? "");

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const {
    data: videosData,
    fetchNextPage: fetchNextVideos,
    hasNextPage: hasMoreVideos,
    isFetchingNextPage: isFetchingMoreVideos,
  } = useVideosInfinite({
    status: "published",
    search: deferredSearch || undefined,
  });

  const {
    data: documentsData,
    fetchNextPage: fetchNextDocuments,
    hasNextPage: hasMoreDocuments,
    isFetchingNextPage: isFetchingMoreDocuments,
  } = useDocumentsInfinite({
    status: "published",
    search: deferredSearch || undefined,
  });

  const {
    data: quizzesData,
    fetchNextPage: fetchNextQuizzes,
    hasNextPage: hasMoreQuizzes,
    isFetchingNextPage: isFetchingMoreQuizzes,
  } = useQuizzesInfinite({
    status: "published",
    search: deferredSearch || undefined,
  });

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const updateItemsMutation = useUpdateModuleItems();
  const generateMutation = useGenerateModule();

  const [kanbanData, setKanbanData] = useState<KanbanItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingItemsRef = useRef<{ contentType: ContentType; contentId: string; order: number }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  const currentStatus = watch("status");

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      if (module) {
        reset({
          title: module.title,
          description: module.description || "",
          status: module.status,
        });
      } else {
        reset({
          title: "",
          description: "",
          status: "draft",
        });
        setKanbanData([]);
        pendingItemsRef.current = [];
      }
    }
  }, [module, open, reset]);

  const allContent = useMemo(() => {
    const items: ContentItem[] = [];

    const videos = videosData?.pages.flatMap((p) => p.videos) ?? [];
    const documents = documentsData?.pages.flatMap((p) => p.documents) ?? [];
    const quizzes = quizzesData?.pages.flatMap((p) => p.quizzes) ?? [];

    items.push(
      ...videos.map((v) => ({
        id: v.id,
        contentType: "video" as ContentType,
        title: v.title,
        duration: v.duration,
      }))
    );

    items.push(
      ...documents.map((d) => ({
        id: d.id,
        contentType: "document" as ContentType,
        title: d.title,
      }))
    );

    items.push(
      ...quizzes.map((q) => ({
        id: q.id,
        contentType: "quiz" as ContentType,
        title: q.title,
      }))
    );

    return items;
  }, [videosData, documentsData, quizzesData]);

  useEffect(() => {
    if (!open || allContent.length === 0) return;

    if (isEditing && moduleData) {
      const moduleItemKeys = new Set(
        moduleData.module.items.map((mi) => `${mi.contentType}:${mi.contentId}`)
      );

      const items: KanbanItem[] = [
        ...allContent
          .filter((c) => !moduleItemKeys.has(`${c.contentType}:${c.id}`))
          .map((c) => ({
            id: `${c.contentType}:${c.id}`,
            name: c.title,
            column: "available",
            contentType: c.contentType,
            contentId: c.id,
            content: c,
          })),
        ...moduleData.module.items
          .sort((a, b) => a.order - b.order)
          .map((mi) => {
            const content = allContent.find(
              (c) => c.contentType === mi.contentType && c.id === mi.contentId
            );
            return {
              id: `${mi.contentType}:${mi.contentId}`,
              name: content?.title ?? "Unknown",
              column: "module",
              contentType: mi.contentType,
              contentId: mi.contentId,
              content: content ?? {
                id: mi.contentId,
                contentType: mi.contentType,
                title: "Unknown",
              },
            };
          }),
      ];

      setKanbanData(items);
    } else if (!isEditing) {
      const items: KanbanItem[] = allContent.map((c) => ({
        id: `${c.contentType}:${c.id}`,
        name: c.title,
        column: "available",
        contentType: c.contentType,
        contentId: c.id,
        content: c,
      }));
      setKanbanData(items);
    }
  }, [moduleData, allContent, open, isEditing]);

  const handleDataChange = useCallback(
    (newData: KanbanItem[]) => {
      setKanbanData(newData);

      const moduleItems = newData
        .filter((item) => item.column === "module")
        .map((item, index) => ({
          contentType: item.contentType,
          contentId: item.contentId,
          order: index,
        }));

      if (isEditing && module) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
          updateItemsMutation.mutate({ id: module.id, items: moduleItems });
        }, 500);
      } else {
        pendingItemsRef.current = moduleItems;
      }
    },
    [isEditing, module, updateItemsMutation]
  );

  const handleFormSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
    };

    if (isEditing && module) {
      updateMutation.mutate(
        { id: module.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (response) => {
          if (pendingItemsRef.current.length > 0) {
            updateItemsMutation.mutate(
              { id: response.module.id, items: pendingItemsRef.current },
              { onSuccess: () => onOpenChange(false) }
            );
          } else {
            onOpenChange(false);
          }
        },
      });
    }
  };

  const columnsWithLabels = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        label:
          col.id === "available"
            ? t("modules.editor.availableContent")
            : t("modules.editor.moduleContent"),
      })),
    [t]
  );

  const availableCount = kanbanData.filter((i) => i.column === "available").length;
  const moduleCount = kanbanData.filter((i) => i.column === "module").length;

  const moduleItems = useMemo(
    () => kanbanData.filter((i) => i.column === "module"),
    [kanbanData]
  );

  const handleGenerateWithAI = useCallback(() => {
    if (moduleItems.length === 0) return;

    const items = moduleItems.map((item) => ({
      contentType: item.contentType,
      contentId: item.contentId,
    }));

    generateMutation.mutate(
      { items },
      {
        onSuccess: (data) => {
          setValue("title", data.title);
          setValue("description", data.description);
        },
      }
    );
  }, [moduleItems, generateMutation, setValue]);

  const hasMoreContent = hasMoreVideos || hasMoreDocuments || hasMoreQuizzes;
  const isFetchingMore = isFetchingMoreVideos || isFetchingMoreDocuments || isFetchingMoreQuizzes;

  const handleAvailableScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const nearBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
      if (nearBottom && !isFetchingMore) {
        if (hasMoreVideos && !isFetchingMoreVideos) fetchNextVideos();
        if (hasMoreDocuments && !isFetchingMoreDocuments) fetchNextDocuments();
        if (hasMoreQuizzes && !isFetchingMoreQuizzes) fetchNextQuizzes();
      }
    },
    [
      hasMoreVideos,
      hasMoreDocuments,
      hasMoreQuizzes,
      isFetchingMoreVideos,
      isFetchingMoreDocuments,
      isFetchingMoreQuizzes,
      isFetchingMore,
      fetchNextVideos,
      fetchNextDocuments,
      fetchNextQuizzes,
    ]
  );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateItemsMutation.isPending;

  const isGenerating = generateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-5xl h-[90vh] lg:h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("modules.edit.title") : t("modules.create.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("modules.edit.description")
              : t("modules.create.description")}
          </DialogDescription>
        </DialogHeader>

        {isEditing && isLoadingModule ? (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 overflow-hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-full flex-1 rounded-lg" />
              <Skeleton className="h-full flex-1 rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 overflow-hidden">
            <div className="space-y-4 overflow-y-auto lg:overflow-visible">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">{t("modules.fields.title")}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateWithAI}
                        disabled={moduleItems.length === 0 || isPending || isGenerating}
                        isLoading={isGenerating}
                        className="h-7 gap-1.5 text-xs"
                      >
                        <Sparkles className="size-3.5" />
                        {t("modules.fields.generateWithAI")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {moduleItems.length === 0
                        ? t("modules.fields.generateTooltipEmpty")
                        : t("modules.fields.generateTooltip")}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="title"
                  {...register("title")}
                  disabled={isPending || isGenerating}
                  placeholder={t("modules.fields.titlePlaceholder")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("modules.fields.description")}</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  disabled={isPending || isGenerating}
                  placeholder={t("modules.fields.descriptionPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="status">{t("modules.fields.publish")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("modules.fields.publishDescription")}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={currentStatus === "published"}
                  onCheckedChange={(checked) =>
                    setValue("status", checked ? "published" : "draft")
                  }
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="min-h-0 flex flex-col overflow-hidden gap-3">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("modules.editor.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="size-3" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <KanbanProvider
                columns={columnsWithLabels}
                data={kanbanData}
                onDataChange={handleDataChange}
                className="h-full min-h-[300px] lg:min-h-0"
              >
                {(column) => (
                  <KanbanBoard id={column.id} key={column.id} className="h-full">
                    <KanbanHeader className="flex items-center justify-between">
                      <span className="text-sm lg:text-base">{column.label}</span>
                      <Badge variant="secondary" size="sm">
                        {column.id === "available" ? availableCount : moduleCount}
                      </Badge>
                    </KanbanHeader>
                    <KanbanCards
                      id={column.id}
                      className="flex-1"
                      onScroll={column.id === "available" ? handleAvailableScroll : undefined}
                    >
                      {(item: KanbanItem) => (
                        <KanbanCard
                          key={item.id}
                          id={item.id}
                          name={item.name}
                          column={item.column}
                        >
                          <ContentCardContent content={item.content} />
                        </KanbanCard>
                      )}
                    </KanbanCards>
                    {column.id === "available" && hasMoreContent && (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        {isFetchingMore
                          ? t("common.loading")
                          : t("modules.editor.scrollForMore")}
                      </div>
                    )}
                  </KanbanBoard>
                )}
              </KanbanProvider>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            isLoading={isPending}
            className="flex-1 sm:flex-none"
          >
            {isEditing ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
