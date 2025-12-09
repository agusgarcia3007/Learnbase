import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Plus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/kibo-ui/kanban";
import { ImageUpload } from "@/components/file-upload/image-upload";
import { VideoUpload } from "@/components/file-upload/video-upload";
import { CategoryCombobox } from "@/components/courses/category-combobox";
import { InstructorCombobox } from "@/components/courses/instructor-combobox";
import {
  useGetCourse,
  useCreateCourse,
  useUpdateCourse,
  useUpdateCourseModules,
  useUploadThumbnail,
  useDeleteThumbnail,
  useUploadVideo,
  useDeleteVideo,
} from "@/services/courses";
import type { Course, CourseLevel, CourseStatus } from "@/services/courses";
import { useGetModules, type Module } from "@/services/modules";
import { useGenerateCourse } from "@/services/ai";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  previewVideoUrl: z.string().optional(),
  instructorId: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  currency: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  features: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

type KanbanItem = {
  id: string;
  name: string;
  column: string;
  module: Module;
};

type CourseEditorProps = {
  course?: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const COLUMNS = [
  { id: "available", name: "available" },
  { id: "course", name: "course" },
];

function ModuleCardContent({ module }: { module: Module }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm leading-tight">{module.title}</p>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" size="sm" className="gap-1">
          <Layers className="size-3" />
          {module.itemsCount} {t("modules.itemsLabel")}
        </Badge>
      </div>
    </div>
  );
}

function ArrayFieldEditor({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={disabled || !newItem.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item, index) => (
            <li
              key={index}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="flex-1">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CourseEditor({
  course,
  open,
  onOpenChange,
}: CourseEditorProps) {
  const { t } = useTranslation();
  const isEditing = !!course;

  const [kanbanData, setKanbanData] = useState<KanbanItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [pendingModules, setPendingModules] = useState<
    { moduleId: string; order: number }[]
  >([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  const { data: courseData } = useGetCourse(course?.id ?? "", {
    enabled: open && isEditing,
  });
  const { data: modulesData } = useGetModules(
    { limit: 200 },
    { enabled: open }
  );

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const updateModulesMutation = useUpdateCourseModules();
  const uploadThumbnailMutation = useUploadThumbnail();
  const deleteThumbnailMutation = useDeleteThumbnail();
  const uploadVideoMutation = useUploadVideo();
  const deleteVideoMutation = useDeleteVideo();
  const generateCourseMutation = useGenerateCourse();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      thumbnail: "",
      previewVideoUrl: "",
      instructorId: "",
      categoryId: "",
      price: 0,
      originalPrice: undefined,
      currency: "USD",
      level: "beginner",
      language: "es",
      status: "draft",
      features: [],
      requirements: [],
      objectives: [],
    },
  });

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setPendingModules([]);
      setModulesLoaded(false);
      if (course) {
        form.reset({
          title: course.title,
          slug: course.slug,
          shortDescription: course.shortDescription || "",
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          previewVideoUrl: course.previewVideoUrl || "",
          instructorId: course.instructorId || "",
          categoryId: course.categoryId || "",
          price: course.price,
          originalPrice: course.originalPrice || undefined,
          currency: course.currency,
          level: course.level,
          language: course.language || "es",
          status: course.status,
          features: course.features || [],
          requirements: course.requirements || [],
          objectives: course.objectives || [],
        });
      } else {
        form.reset({
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          thumbnail: "",
          previewVideoUrl: "",
          instructorId: "",
          categoryId: "",
          price: 0,
          originalPrice: undefined,
          currency: "USD",
          level: "beginner",
          language: "es",
          status: "draft",
          features: [],
          requirements: [],
          objectives: [],
        });
        setKanbanData([]);
      }
    }
  }, [course, open, form]);

  useEffect(() => {
    if (!open || !modulesData) return;

    if (isEditing && courseData) {
      const courseModuleIds = new Set(
        courseData.course.modules.map((cm) => cm.moduleId)
      );

      const items: KanbanItem[] = [
        ...modulesData.modules
          .filter((m) => !courseModuleIds.has(m.id))
          .map((m) => ({
            id: m.id,
            name: m.title,
            column: "available",
            module: m,
          })),
        ...courseData.course.modules
          .sort((a, b) => a.order - b.order)
          .map((cm) => ({
            id: cm.moduleId,
            name: cm.module.title,
            column: "course",
            module: cm.module,
          })),
      ];

      setKanbanData(items);
      setPendingModules(
        courseData.course.modules
          .sort((a, b) => a.order - b.order)
          .map((cm, index) => ({ moduleId: cm.moduleId, order: index }))
      );
      setModulesLoaded(true);
    } else if (!isEditing) {
      const items: KanbanItem[] = modulesData.modules.map((m) => ({
        id: m.id,
        name: m.title,
        column: "available",
        module: m,
      }));
      setKanbanData(items);
      setModulesLoaded(true);
    }
  }, [courseData, modulesData, open, isEditing]);

  const handleDataChange = useCallback((newData: KanbanItem[]) => {
    setKanbanData(newData);

    const courseModules = newData
      .filter((item) => item.column === "course")
      .map((item, index) => ({
        moduleId: item.id,
        order: index,
      }));

    setPendingModules(courseModules);
  }, []);

  const handleFormSubmit = async (data: FormData) => {
    const isBase64Thumbnail = data.thumbnail?.startsWith("data:");

    const payload = {
      title: data.title,
      slug: data.slug || undefined,
      shortDescription: data.shortDescription || undefined,
      description: data.description || undefined,
      thumbnail: isBase64Thumbnail ? undefined : (data.thumbnail || undefined),
      previewVideoUrl: data.previewVideoUrl || undefined,
      instructorId: data.instructorId || undefined,
      categoryId: data.categoryId || undefined,
      price: data.price,
      originalPrice: data.originalPrice,
      currency: data.currency,
      level: data.level as CourseLevel,
      language: data.language,
      status: data.status as CourseStatus,
      features: data.features?.length ? data.features : undefined,
      requirements: data.requirements?.length ? data.requirements : undefined,
      objectives: data.objectives?.length ? data.objectives : undefined,
    };

    const uploadThumbnailIfNeeded = async (courseId: string) => {
      if (isBase64Thumbnail && data.thumbnail) {
        await uploadThumbnailMutation.mutateAsync({
          id: courseId,
          thumbnail: data.thumbnail,
        });
      }
    };

    const updateModulesIfNeeded = (courseId: string) => {
      if (modulesLoaded && pendingModules.length > 0) {
        updateModulesMutation.mutate(
          { id: courseId, modules: pendingModules },
          { onSuccess: () => onOpenChange(false) }
        );
      } else {
        onOpenChange(false);
      }
    };

    if (isEditing && course) {
      updateMutation.mutate(
        { id: course.id, ...payload },
        {
          onSuccess: async () => {
            await uploadThumbnailIfNeeded(course.id);
            updateModulesIfNeeded(course.id);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: async (result) => {
          await uploadThumbnailIfNeeded(result.course.id);
          updateModulesIfNeeded(result.course.id);
        },
      });
    }
  };

  const handleThumbnailUpload = useCallback(
    async (base64: string) => {
      if (!course?.id) {
        form.setValue("thumbnail", base64);
        return base64;
      }
      const result = await uploadThumbnailMutation.mutateAsync({
        id: course.id,
        thumbnail: base64,
      });
      form.setValue("thumbnail", result.thumbnailUrl);
      return result.thumbnailUrl;
    },
    [course?.id, form, uploadThumbnailMutation]
  );

  const handleThumbnailDelete = useCallback(async () => {
    if (course?.id) {
      await deleteThumbnailMutation.mutateAsync(course.id);
    }
    form.setValue("thumbnail", "");
  }, [course?.id, form, deleteThumbnailMutation]);

  const handleVideoUpload = useCallback(
    async ({ base64 }: { base64: string; duration: number }) => {
      if (!course?.id) {
        form.setValue("previewVideoUrl", base64);
        return base64;
      }
      const result = await uploadVideoMutation.mutateAsync({
        id: course.id,
        video: base64,
      });
      form.setValue("previewVideoUrl", result.videoUrl);
      return result.videoUrl;
    },
    [course?.id, form, uploadVideoMutation]
  );

  const handleVideoDelete = useCallback(async () => {
    if (course?.id) {
      await deleteVideoMutation.mutateAsync(course.id);
    }
    form.setValue("previewVideoUrl", "");
  }, [course?.id, form, deleteVideoMutation]);

  const handleAIGenerate = useCallback(() => {
    const selectedModuleIds = pendingModules.map((m) => m.moduleId);
    if (selectedModuleIds.length === 0) {
      toast.error(t("courses.ai.noModulesSelected"));
      return;
    }

    generateCourseMutation.mutate(
      { moduleIds: selectedModuleIds },
      {
        onSuccess: (data) => {
          form.setValue("title", data.title);
          form.setValue("shortDescription", data.shortDescription);
          form.setValue("description", data.description);
          form.setValue("objectives", data.objectives);
          form.setValue("requirements", data.requirements);
          form.setValue("features", data.features);
          if (data.thumbnail) {
            form.setValue("thumbnail", data.thumbnail);
          }
          toast.success(t("courses.ai.generateSuccess"));
        },
      }
    );
  }, [pendingModules, generateCourseMutation, form, t]);

  const columnsWithLabels = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        label:
          col.id === "available"
            ? t("courses.editor.availableModules")
            : t("courses.editor.courseModules"),
      })),
    [t]
  );

  const availableCount = kanbanData.filter(
    (i) => i.column === "available"
  ).length;
  const courseCount = kanbanData.filter((i) => i.column === "course").length;

  const isPending = createMutation.isPending || updateMutation.isPending || updateModulesMutation.isPending;
  const isGenerating = generateCourseMutation.isPending;

  const canGoNext = () => {
    if (currentStep === 1) {
      return pendingModules.length > 0;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-5xl h-[90vh] lg:h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("courses.edit.title") : t("courses.create.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("courses.edit.description")
              : t("courses.create.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            {isGenerating && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/90 backdrop-blur-sm">
                <div className="h-2 w-48 overflow-hidden rounded-full bg-primary/20">
                  <div className="h-full w-1/2 animate-[shimmer-slide_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
                </div>
                <p className="text-sm font-medium text-primary">
                  {t("courses.ai.generating")}
                </p>
              </div>
            )}

            <Stepper
              value={currentStep}
              onValueChange={setCurrentStep}
              className="flex-1 min-h-0 flex flex-col"
            >
              <StepperNav className="mb-6">
                <StepperItem step={1}>
                  <StepperTrigger>
                    <StepperIndicator>1</StepperIndicator>
                    <StepperTitle className="hidden sm:block">
                      {t("courses.editor.steps.modules")}
                    </StepperTitle>
                  </StepperTrigger>
                  <StepperSeparator />
                </StepperItem>
                <StepperItem step={2}>
                  <StepperTrigger>
                    <StepperIndicator>2</StepperIndicator>
                    <StepperTitle className="hidden sm:block">
                      {t("courses.editor.steps.pricing")}
                    </StepperTitle>
                  </StepperTrigger>
                  <StepperSeparator />
                </StepperItem>
                <StepperItem step={3}>
                  <StepperTrigger>
                    <StepperIndicator>3</StepperIndicator>
                    <StepperTitle className="hidden sm:block">
                      {t("courses.editor.steps.information")}
                    </StepperTitle>
                  </StepperTrigger>
                </StepperItem>
              </StepperNav>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <StepperContent value={1} className="h-full">
                  <div className="h-full min-h-[400px]">
                    <KanbanProvider
                      columns={columnsWithLabels}
                      data={kanbanData}
                      onDataChange={handleDataChange}
                      className="h-full"
                    >
                      {(column) => (
                        <KanbanBoard
                          id={column.id}
                          key={column.id}
                          className="h-full"
                        >
                          <KanbanHeader className="flex items-center justify-between">
                            <span className="text-sm lg:text-base">
                              {column.label}
                            </span>
                            <Badge variant="secondary" size="sm">
                              {column.id === "available"
                                ? availableCount
                                : courseCount}
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
                                <ModuleCardContent module={item.module} />
                              </KanbanCard>
                            )}
                          </KanbanCards>
                        </KanbanBoard>
                      )}
                    </KanbanProvider>
                  </div>
                </StepperContent>

                <StepperContent value={2} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.price")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              disabled={isPending}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            {t("courses.form.priceHelp")}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.originalPrice")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                              disabled={isPending}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            {t("courses.form.originalPriceHelp")}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>{t("courses.form.publish")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("courses.form.publishDescription")}
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("status") === "published"}
                      onCheckedChange={(checked) =>
                        form.setValue("status", checked ? "published" : "draft")
                      }
                      disabled={isPending}
                    />
                  </div>
                </StepperContent>

                <StepperContent value={3} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t("courses.ai.description")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAIGenerate}
                      disabled={isGenerating || isPending || pendingModules.length === 0}
                    >
                      <Sparkles className="mr-2 size-4" />
                      {t("courses.ai.generateButton")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.title")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isPending || isGenerating} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.slug")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending || isGenerating}
                              placeholder={t("courses.form.slugPlaceholder")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("courses.form.shortDescription")}
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} disabled={isPending || isGenerating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("courses.form.description")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} disabled={isPending || isGenerating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="thumbnail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.thumbnail")}</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value || null}
                              onChange={(url) => field.onChange(url || "")}
                              onUpload={handleThumbnailUpload}
                              onDelete={handleThumbnailDelete}
                              isUploading={uploadThumbnailMutation.isPending}
                              isDeleting={deleteThumbnailMutation.isPending}
                              disabled={isPending || isGenerating}
                              aspectRatio="16/9"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="previewVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.previewVideo")}</FormLabel>
                          <FormControl>
                            <VideoUpload
                              value={field.value || null}
                              onChange={(url) => field.onChange(url || "")}
                              onUpload={handleVideoUpload}
                              onDelete={handleVideoDelete}
                              isUploading={uploadVideoMutation.isPending}
                              isDeleting={deleteVideoMutation.isPending}
                              disabled={isPending || isGenerating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.category")}</FormLabel>
                          <FormControl>
                            <CategoryCombobox
                              value={field.value}
                              onChange={(id) => field.onChange(id || "")}
                              disabled={isPending || isGenerating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instructorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.instructor")}</FormLabel>
                          <FormControl>
                            <InstructorCombobox
                              value={field.value}
                              onChange={(id) => field.onChange(id || "")}
                              disabled={isPending || isGenerating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.level")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending || isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">
                                {t("courses.levels.beginner")}
                              </SelectItem>
                              <SelectItem value="intermediate">
                                {t("courses.levels.intermediate")}
                              </SelectItem>
                              <SelectItem value="advanced">
                                {t("courses.levels.advanced")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.language")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending || isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="es">Espanol</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("courses.form.objectives")}</FormLabel>
                        <FormControl>
                          <ArrayFieldEditor
                            value={field.value ?? []}
                            onChange={field.onChange}
                            placeholder={t("courses.form.objectivesPlaceholder")}
                            disabled={isPending || isGenerating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("courses.form.requirements")}</FormLabel>
                        <FormControl>
                          <ArrayFieldEditor
                            value={field.value ?? []}
                            onChange={field.onChange}
                            placeholder={t(
                              "courses.form.requirementsPlaceholder"
                            )}
                            disabled={isPending || isGenerating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("courses.form.features")}</FormLabel>
                        <FormControl>
                          <ArrayFieldEditor
                            value={field.value ?? []}
                            onChange={field.onChange}
                            placeholder={t("courses.form.featuresPlaceholder")}
                            disabled={isPending || isGenerating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </StepperContent>
              </div>
            </Stepper>

            <DialogFooter className="flex-row gap-2 sm:gap-0 mt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isPending}
                  className="flex-1 sm:flex-none"
                >
                  {t("common.previous")}
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={isPending || !canGoNext()}
                  className="flex-1 sm:flex-none"
                >
                  {t("common.next")}
                </Button>
              ) : (
                <>
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
                    type="submit"
                    isLoading={isPending}
                    className="flex-1 sm:flex-none"
                  >
                    {isEditing ? t("common.save") : t("common.create")}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
