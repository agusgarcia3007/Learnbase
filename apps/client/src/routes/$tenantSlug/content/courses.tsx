import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Award,
  BookOpen,
  Calendar,
  DollarSign,
  Ellipsis,
  ExternalLink,
  FolderTree,
  GraduationCap,
  ImageIcon,
  Layers,
  ListFilter,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { CourseEditor, AICoursePanel } from "@/components/courses";
import { useRightSidebar } from "@/components/ui/sidebar";
import { createSeoMeta } from "@/lib/seo";
import type { CoursePreview } from "@/hooks/use-ai-course-chat";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useGetCourses,
  useGetCourse,
  useDeleteCourse,
  type Course,
  type CourseStatus,
  type CourseLevel,
} from "@/services/courses";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$tenantSlug/content/courses")({
  head: () =>
    createSeoMeta({
      title: "Courses",
      description: "Manage your courses",
      noindex: true,
    }),
  component: CoursesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
    level: (search.level as string) || undefined,
    categoryIds: (search.categoryIds as string) || undefined,
    edit: (search.edit as string) || undefined,
  }),
});

const STATUS_VARIANTS: Record<CourseStatus, "success" | "secondary"> = {
  published: "success",
  draft: "secondary",
};

const LEVEL_VARIANTS: Record<CourseLevel, "primary" | "secondary" | "success"> = {
  beginner: "primary",
  intermediate: "secondary",
  advanced: "success",
};

function CoursesPage() {
  const { t } = useTranslation();
  const { tenantSlug } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data: courseToEdit } = useGetCourse(searchParams.edit ?? "", {
    enabled: !!searchParams.edit,
  });

  const { data, isLoading } = useGetCourses({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    level: tableState.serverParams.level as string | undefined,
    categoryIds: tableState.serverParams.categoryIds as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [aiPreview, setAiPreview] = useState<CoursePreview | null>(null);
  const [generatingThumbnailCourseId, setGeneratingThumbnailCourseId] = useState<string | null>(null);
  const { open: aiPanelOpen, toggle: toggleAiPanel } = useRightSidebar();

  const deleteMutation = useDeleteCourse();

  useEffect(() => {
    if (searchParams.edit && courseToEdit?.course && !editorOpen) {
       
      setEditCourse(courseToEdit.course as Course);
       
      setEditorOpen(true);
    }
  }, [searchParams.edit, courseToEdit, editorOpen]);

  const handleOpenCreate = useCallback(() => {
    setEditCourse(null);
    setAiPreview(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((course: Course) => {
    setEditCourse(course);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback((open: boolean) => {
    if (!open) {
      setEditorOpen(false);
      setEditCourse(null);
      setAiPreview(null);
      if (searchParams.edit) {
        navigate({
          to: ".",
          search: { ...searchParams, edit: undefined },
          replace: true,
        });
      }
    }
  }, [searchParams, navigate]);

  const handleDelete = useCallback(() => {
    if (!deleteCourse) return;
    deleteMutation.mutate(deleteCourse.id, {
      onSuccess: () => setDeleteCourse(null),
    });
  }, [deleteCourse, deleteMutation]);

  const handleViewOnCampus = useCallback(
    (course: Course) => {
      const campusUrl = `${window.location.protocol}//${tenantSlug}.${window.location.host.split(".").slice(-2).join(".")}/courses/${course.slug}`;
      window.open(campusUrl, "_blank");
    },
    [tenantSlug]
  );

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return t("courses.free");
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
    }).format(price / 100);
  };

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.title")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const isGenerating = row.original.id === generatingThumbnailCourseId;
          return (
            <div className="flex items-center gap-3">
              {isGenerating ? (
                <div className="relative size-12 rounded-lg bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent animate-shimmer" />
                </div>
              ) : row.original.thumbnail ? (
                <img
                  src={row.original.thumbnail}
                  alt={row.original.title}
                  className="size-12 rounded-lg object-cover"
                />
              ) : (
                <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
                  <BookOpen className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-px min-w-0">
                <div className="font-medium text-foreground truncate">
                  {row.original.title}
                </div>
                {row.original.shortDescription && (
                  <div className="text-muted-foreground text-xs line-clamp-1">
                    {row.original.shortDescription}
                  </div>
                )}
              </div>
            </div>
          );
        },
        size: 350,
        enableSorting: true,
        meta: {
          headerTitle: t("courses.columns.title"),
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "instructor",
        id: "instructor",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.instructor")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const instructor = row.original.instructor;
          if (!instructor) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src={instructor.avatar ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(instructor.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{instructor.name}</span>
            </div>
          );
        },
        size: 180,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.instructor"),
          skeleton: (
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ),
        },
      },
      {
        accessorKey: "enrollmentsCount",
        id: "enrollmentsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.students")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="outline" size="sm" className="gap-1">
            <Users className="size-3" />
            {row.original.enrollmentsCount}
          </Badge>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.students"),
          skeleton: <Skeleton className="h-5 w-12" />,
        },
      },
      {
        accessorKey: "completionRate",
        id: "completionRate",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.completionRate")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const rate =
            row.original.enrollmentsCount > 0
              ? Math.round(
                  (row.original.completedCount / row.original.enrollmentsCount) * 100
                )
              : 0;
          const variant = rate >= 70 ? "success" : rate >= 40 ? "warning" : "secondary";
          return (
            <Badge variant={variant} appearance="outline" size="sm">
              {rate}%
            </Badge>
          );
        },
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.completionRate"),
          skeleton: <Skeleton className="h-5 w-12" />,
        },
      },
      {
        accessorKey: "revenue",
        id: "revenue",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.revenue")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-sm">
            {formatPrice(row.original.revenue, row.original.currency)}
          </span>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.revenue"),
          skeleton: <Skeleton className="h-4 w-16" />,
        },
      },
      {
        accessorKey: "avgProgress",
        id: "avgProgress",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.avgProgress")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {Math.round(row.original.avgProgress)}%
          </span>
        ),
        size: 80,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.avgProgress"),
          skeleton: <Skeleton className="h-4 w-10" />,
        },
      },
      {
        accessorKey: "lessonsCount",
        id: "lessonsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.lessons")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="info" appearance="outline" size="sm" className="gap-1">
            <GraduationCap className="size-3" />
            {row.original.lessonsCount}
          </Badge>
        ),
        size: 80,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.lessons"),
          skeleton: <Skeleton className="h-5 w-10" />,
        },
      },
      {
        accessorKey: "certificatesCount",
        id: "certificatesCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.certificates")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="success" appearance="outline" size="sm" className="gap-1">
            <Award className="size-3" />
            {row.original.certificatesCount}
          </Badge>
        ),
        size: 80,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.certificates"),
          skeleton: <Skeleton className="h-5 w-10" />,
        },
      },
      {
        accessorKey: "categories",
        id: "categories",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.category")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const categories = row.original.categories;
          if (!categories?.length) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 2).map((cat) => (
                <Badge key={cat.id} variant="outline" size="sm" className="gap-1">
                  <FolderTree className="size-3" />
                  {cat.name}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge variant="outline" size="sm">
                  +{categories.length - 2}
                </Badge>
              )}
            </div>
          );
        },
        size: 200,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.category"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "modulesCount",
        id: "modulesCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.modules")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" size="sm" className="gap-1">
            <Layers className="size-3" />
            {row.original.modulesCount}
          </Badge>
        ),
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.modules"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "price",
        id: "price",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.price")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.price === 0 ? "success" : "primary"}
            appearance="light"
            size="sm"
            className="gap-1"
          >
            <DollarSign className="size-3" />
            {formatPrice(row.original.price, row.original.currency)}
          </Badge>
        ),
        size: 120,
        enableSorting: false,
        meta: {
          headerTitle: t("courses.columns.price"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "level",
        id: "level",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.level")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const level = row.original.level;
          return (
            <Badge variant={LEVEL_VARIANTS[level]} appearance="light" size="sm">
              {t(`courses.levels.${level}`)}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("courses.columns.level"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={STATUS_VARIANTS[status]} appearance="light" size="sm">
              {t(`courses.statuses.${status}`)}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("courses.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("courses.columns.createdAt")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("courses.columns.createdAt"),
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-7" mode="icon" variant="ghost">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={() => handleOpenEdit(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              {row.original.status === "published" && (
                <DropdownMenuItem onClick={() => handleViewOnCampus(row.original)}>
                  <ExternalLink className="mr-2 size-4" />
                  {t("courses.viewOnCampus")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteCourse(row.original)}
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, handleOpenEdit, handleViewOnCampus, generatingThumbnailCourseId, formatPrice]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "status",
        label: t("courses.filters.status"),
        type: "multiselect",
        icon: <ListFilter className="size-3.5" />,
        options: [
          { value: "draft", label: t("courses.statuses.draft") },
          { value: "published", label: t("courses.statuses.published") },
          { value: "archived", label: t("courses.statuses.archived") },
        ],
      },
      {
        key: "level",
        label: t("courses.filters.level"),
        type: "multiselect",
        icon: <ListFilter className="size-3.5" />,
        options: [
          { value: "beginner", label: t("courses.levels.beginner") },
          { value: "intermediate", label: t("courses.levels.intermediate") },
          { value: "advanced", label: t("courses.levels.advanced") },
        ],
      },
      {
        key: "createdAt",
        label: t("courses.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const courses = data?.courses ?? [];

  return (
    <div className="flex h-full -m-6 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("courses.title")}</h1>
              <p className="text-muted-foreground">{t("courses.description")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={aiPanelOpen ? "secondary" : "outline"}
                    onClick={toggleAiPanel}
                    className={cn(
                      "gap-2",
                      aiPanelOpen && "bg-primary/10 border-primary/30 text-primary"
                    )}
                  >
                    <Sparkles className="size-4" />
                    {t("courses.aiCreator.toggle")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {aiPanelOpen ? "Cerrar asistente IA" : "Abrir asistente IA"}
                </TooltipContent>
              </Tooltip>
              <Button onClick={handleOpenCreate}>
                <Plus className="size-4" />
                {t("courses.create.button")}
              </Button>
            </div>
          </div>

          <DataTable
            data={courses}
            columns={columns}
            pagination={data?.pagination}
            isLoading={isLoading}
            tableState={tableState}
            filterFields={filterFields}
            emptyState={{
              title: t("courses.empty.title"),
              description: t("courses.empty.description"),
              action: (
                <Button onClick={handleOpenCreate}>
                  <Plus className="size-4" />
                  {t("courses.create.button")}
                </Button>
              ),
            }}
          />
        </div>
      </div>

      <AICoursePanel
        onGeneratingThumbnailChange={setGeneratingThumbnailCourseId}
      />

      <CourseEditor
        course={editCourse}
        aiPreview={aiPreview}
        open={editorOpen}
        onOpenChange={handleCloseEditor}
      />

      <DeleteDialog
        open={!!deleteCourse}
        onOpenChange={(open) => !open && setDeleteCourse(null)}
        title={t("courses.delete.title")}
        description={t("courses.delete.description", {
          name: deleteCourse?.title,
        })}
        confirmValue={deleteCourse?.title ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
