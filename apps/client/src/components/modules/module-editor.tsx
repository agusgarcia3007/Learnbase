import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, ListFilter, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  useUpdateModuleLessons,
} from "@/services/modules";
import type { Module } from "@/services/modules";
import { useGetLessons, type Lesson, type LessonType } from "@/services/lessons";
import { formatDuration } from "@/components/lessons";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type FormData = z.infer<typeof schema>;

type KanbanItem = {
  id: string;
  name: string;
  column: string;
  lesson: Lesson;
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

function TypeIcon({ type }: { type: LessonType }) {
  switch (type) {
    case "video":
      return <Video className="size-3" />;
    case "text":
      return <FileText className="size-3" />;
    case "quiz":
      return <ListFilter className="size-3" />;
  }
}

function LessonCardContent({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm leading-tight">{lesson.title}</p>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" size="sm" className="gap-1">
          <TypeIcon type={lesson.type} />
          {t(`lessons.types.${lesson.type}`)}
        </Badge>
        {lesson.duration > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(lesson.duration)}
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

  const { data: moduleData } = useGetModule(module?.id ?? "");
  const { data: lessonsData } = useGetLessons({ limit: 200 });

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const updateLessonsMutation = useUpdateModuleLessons();

  const [kanbanData, setKanbanData] = useState<KanbanItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLessonsRef = useRef<{ lessonId: string; order: number }[]>([]);

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
        pendingLessonsRef.current = [];
      }
    }
  }, [module, open, reset]);

  useEffect(() => {
    if (!open || !lessonsData) return;

    if (isEditing && moduleData) {
      const moduleLessonIds = new Set(
        moduleData.module.lessons.map((ml) => ml.lessonId)
      );

      const items: KanbanItem[] = [
        ...lessonsData.lessons
          .filter((l) => !moduleLessonIds.has(l.id))
          .map((l) => ({
            id: l.id,
            name: l.title,
            column: "available",
            lesson: l,
          })),
        ...moduleData.module.lessons
          .sort((a, b) => a.order - b.order)
          .map((ml) => ({
            id: ml.lessonId,
            name: ml.lesson.title,
            column: "module",
            lesson: ml.lesson,
          })),
      ];

      setKanbanData(items);
    } else if (!isEditing) {
      const items: KanbanItem[] = lessonsData.lessons.map((l) => ({
        id: l.id,
        name: l.title,
        column: "available",
        lesson: l,
      }));
      setKanbanData(items);
    }
  }, [moduleData, lessonsData, open, isEditing]);

  const handleDataChange = useCallback(
    (newData: KanbanItem[]) => {
      setKanbanData(newData);

      const moduleLessons = newData
        .filter((item) => item.column === "module")
        .map((item, index) => ({
          lessonId: item.id,
          order: index,
        }));

      if (isEditing && module) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
          updateLessonsMutation.mutate({ id: module.id, lessons: moduleLessons });
        }, 500);
      } else {
        pendingLessonsRef.current = moduleLessons;
      }
    },
    [isEditing, module, updateLessonsMutation]
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
          if (pendingLessonsRef.current.length > 0) {
            updateLessonsMutation.mutate(
              { id: response.module.id, lessons: pendingLessonsRef.current },
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
            ? t("modules.editor.availableLessons")
            : t("modules.editor.moduleLessons"),
      })),
    [t]
  );

  const availableCount = kanbanData.filter((i) => i.column === "available").length;
  const moduleCount = kanbanData.filter((i) => i.column === "module").length;

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateLessonsMutation.isPending;

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

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 overflow-hidden">
          <div className="space-y-4 overflow-y-auto lg:overflow-visible">
            <div className="space-y-2">
              <Label htmlFor="title">{t("modules.fields.title")}</Label>
              <Input
                id="title"
                {...register("title")}
                disabled={isPending}
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
                disabled={isPending}
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

          <div className="min-h-0 flex flex-col overflow-hidden">
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
                  <KanbanCards id={column.id} className="flex-1">
                    {(item: KanbanItem) => (
                      <KanbanCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        column={item.column}
                      >
                        <LessonCardContent lesson={item.lesson} />
                      </KanbanCard>
                    )}
                  </KanbanCards>
                </KanbanBoard>
              )}
            </KanbanProvider>
          </div>
        </div>

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
