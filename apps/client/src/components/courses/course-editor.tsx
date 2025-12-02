import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Minus, Plus, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/kibo-ui/kanban";
import {
  useGetCourse,
  useCreateCourse,
  useUpdateCourse,
  useUpdateCourseModules,
} from "@/services/courses";
import type { Course, CourseLevel, CourseStatus } from "@/services/courses";
import { useGetModules, type Module } from "@/services/modules";
import { useGetCategories } from "@/services/categories";
import { useGetInstructors } from "@/services/instructors";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  previewVideoUrl: z.string().optional(),
  instructorId: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0).default(0),
  originalPrice: z.number().min(0).optional(),
  currency: z.string().default("USD"),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  language: z.string().default("es"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
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
          {module.lessonsCount} {t("modules.lessonsLabel")}
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

  const { data: courseData } = useGetCourse(course?.id ?? "");
  const { data: modulesData } = useGetModules({ limit: 200 });
  const { data: categoriesData } = useGetCategories({ limit: 100 });
  const { data: instructorsData } = useGetInstructors({ limit: 100 });

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const updateModulesMutation = useUpdateCourseModules();

  const [kanbanData, setKanbanData] = useState<KanbanItem[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingModulesRef = useRef<{ moduleId: string; order: number }[]>([]);

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
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab("basic");
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
        pendingModulesRef.current = [];
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
    } else if (!isEditing) {
      const items: KanbanItem[] = modulesData.modules.map((m) => ({
        id: m.id,
        name: m.title,
        column: "available",
        module: m,
      }));
      setKanbanData(items);
    }
  }, [courseData, modulesData, open, isEditing]);

  const handleDataChange = useCallback(
    (newData: KanbanItem[]) => {
      setKanbanData(newData);

      const courseModules = newData
        .filter((item) => item.column === "course")
        .map((item, index) => ({
          moduleId: item.id,
          order: index,
        }));

      if (isEditing && course) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
          updateModulesMutation.mutate({ id: course.id, modules: courseModules });
        }, 500);
      } else {
        pendingModulesRef.current = courseModules;
      }
    },
    [isEditing, course, updateModulesMutation]
  );

  const handleFormSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      slug: data.slug || undefined,
      shortDescription: data.shortDescription || undefined,
      description: data.description || undefined,
      thumbnail: data.thumbnail || undefined,
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

    if (isEditing && course) {
      updateMutation.mutate(
        { id: course.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (response) => {
          if (pendingModulesRef.current.length > 0) {
            updateModulesMutation.mutate(
              { id: response.course.id, modules: pendingModulesRef.current },
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
            ? t("courses.editor.availableModules")
            : t("courses.editor.courseModules"),
      })),
    [t]
  );

  const availableCount = kanbanData.filter((i) => i.column === "available").length;
  const courseCount = kanbanData.filter((i) => i.column === "course").length;

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateModulesMutation.isPending;

  const categories = categoriesData?.categories ?? [];
  const instructors = instructorsData?.instructors ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl h-[90vh] lg:h-[85vh] flex flex-col">
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
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 min-h-0 flex flex-col"
            >
              <TabsList className="w-full justify-start">
                <TabsTrigger value="basic">
                  {t("courses.editor.tabs.basic")}
                </TabsTrigger>
                <TabsTrigger value="content">
                  {t("courses.editor.tabs.content")}
                </TabsTrigger>
                <TabsTrigger value="pricing">
                  {t("courses.editor.tabs.pricing")}
                </TabsTrigger>
                <TabsTrigger value="modules">
                  {t("courses.editor.tabs.modules")}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-y-auto mt-4">
                <TabsContent value="basic" className="mt-0 space-y-4 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.title")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isPending} />
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
                              disabled={isPending}
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
                        <FormLabel>{t("courses.form.shortDescription")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} disabled={isPending} />
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
                          <Textarea {...field} rows={4} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.category")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("courses.form.categoryPlaceholder")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("courses.form.instructorPlaceholder")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {instructors.map((inst) => (
                                <SelectItem key={inst.id} value={inst.id}>
                                  {inst.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.level")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
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
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between rounded-lg border p-3">
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
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-0 space-y-4 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="thumbnail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.thumbnail")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://"
                              disabled={isPending}
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
                            <Input
                              {...field}
                              placeholder="https://"
                              disabled={isPending}
                            />
                          </FormControl>
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
                            disabled={isPending}
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
                            placeholder={t("courses.form.requirementsPlaceholder")}
                            disabled={isPending}
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
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 space-y-4 h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("courses.form.currency")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="ARS">ARS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="modules" className="mt-0 h-full">
                  <div className="h-full min-h-[400px]">
                    <KanbanProvider
                      columns={columnsWithLabels}
                      data={kanbanData}
                      onDataChange={handleDataChange}
                      className="h-full"
                    >
                      {(column) => (
                        <KanbanBoard id={column.id} key={column.id} className="h-full">
                          <KanbanHeader className="flex items-center justify-between">
                            <span className="text-sm lg:text-base">{column.label}</span>
                            <Badge variant="secondary" size="sm">
                              {column.id === "available" ? availableCount : courseCount}
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
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="flex-row gap-2 sm:gap-0 mt-4">
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
