import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Ellipsis, Eye, FileText, ListFilter, Play, Plus, Video } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/kibo-ui/video-player";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { LessonDialog, formatDuration } from "@/components/lessons";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useGetLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "@/services/lessons";
import { lessonsListOptions } from "@/services/lessons/options";
import type { Lesson, LessonType, LessonStatus, CreateLessonRequest, UpdateLessonRequest } from "@/services/lessons";

export const Route = createFileRoute("/$tenantSlug/content/classes")({
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(lessonsListOptions({ page: 1, limit: 10 }));
  },
  component: ClassesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    type: (search.type as string) || undefined,
    status: (search.status as string) || undefined,
  }),
});

const TYPE_CONFIG: Record<LessonType, { variant: "primary" | "secondary" | "warning" }> = {
  video: { variant: "primary" },
  text: { variant: "secondary" },
  quiz: { variant: "warning" },
};

const STATUS_VARIANTS: Record<LessonStatus, "success" | "secondary"> = {
  published: "success",
  draft: "secondary",
};

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

function ClassesPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useGetLessons({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    type: tableState.serverParams.type as string | undefined,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const deleteMutation = useDeleteLesson();

  const handleOpenCreate = useCallback(() => {
    setEditLesson(null);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((lesson: Lesson) => {
    setEditLesson(lesson);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditLesson(null);
  }, []);

  const handleSetDeleteLesson = useCallback((lesson: Lesson) => {
    setDeleteLesson(lesson);
  }, []);

  const handleSubmit = useCallback((formData: CreateLessonRequest | UpdateLessonRequest) => {
    if (editLesson) {
      updateMutation.mutate(
        { id: editLesson.id, ...formData },
        { onSuccess: handleCloseDialog }
      );
    } else {
      createMutation.mutate(formData as CreateLessonRequest, {
        onSuccess: handleCloseDialog,
      });
    }
  }, [editLesson, createMutation, updateMutation, handleCloseDialog]);

  const handleDelete = useCallback(() => {
    if (!deleteLesson) return;
    deleteMutation.mutate(deleteLesson.id, {
      onSuccess: () => setDeleteLesson(null),
    });
  }, [deleteLesson, deleteMutation]);

  const columns = useMemo<ColumnDef<Lesson>[]>(
    () => [
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.title")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {row.original.title}
              </div>
              {row.original.description && (
                <div className="text-muted-foreground text-xs line-clamp-1">
                  {row.original.description}
                </div>
              )}
            </div>
          </div>
        ),
        size: 300,
        enableSorting: true,
        meta: {
          headerTitle: t("lessons.columns.title"),
          skeleton: (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          ),
        },
      },
      {
        accessorKey: "videoUrl",
        id: "videoUrl",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.video")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const { videoUrl, type } = row.original;
          if (type !== "video" || !videoUrl) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <button
              type="button"
              onClick={() => setPreviewLesson(row.original)}
              className="group relative h-12 w-20 overflow-hidden rounded border border-border bg-muted transition-all hover:border-primary"
            >
              <video
                src={videoUrl}
                className="h-full w-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="size-5 text-white" fill="white" />
              </div>
            </button>
          );
        },
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("lessons.columns.video"),
          skeleton: <Skeleton className="h-12 w-20 rounded" />,
        },
      },
      {
        accessorKey: "type",
        id: "type",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.type")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const type = row.original.type;
          const { variant } = TYPE_CONFIG[type];
          return (
            <Badge variant={variant} appearance="outline" size="sm" className="gap-1">
              <TypeIcon type={type} />
              {t(`lessons.types.${type}`)}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("lessons.columns.type"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "duration",
        id: "duration",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.duration")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.duration > 0 ? formatDuration(row.original.duration) : "-"}
          </span>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("lessons.columns.duration"),
          skeleton: <Skeleton className="h-4 w-12" />,
        },
      },
      {
        accessorKey: "isPreview",
        id: "isPreview",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.preview")}
            column={column}
          />
        ),
        cell: ({ row }) =>
          row.original.isPreview ? (
            <Badge variant="info" appearance="light" size="sm" className="gap-1">
              <Eye className="size-3" />
              {t("lessons.preview")}
            </Badge>
          ) : null,
        size: 100,
        enableSorting: false,
        meta: {
          headerTitle: t("lessons.columns.preview"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={STATUS_VARIANTS[status]} appearance="light" size="sm">
              {t(`lessons.statuses.${status}`)}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
        meta: {
          headerTitle: t("lessons.columns.status"),
          skeleton: <Skeleton className="h-5 w-20" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("lessons.columns.createdAt")}
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
          headerTitle: t("lessons.columns.createdAt"),
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleSetDeleteLesson(row.original)}
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
    [t, handleOpenEdit, handleSetDeleteLesson]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "type",
        label: t("lessons.filters.type"),
        type: "multiselect",
        icon: <Video className="size-3.5" />,
        options: [
          { value: "video", label: t("lessons.types.video") },
          { value: "text", label: t("lessons.types.text") },
          { value: "quiz", label: t("lessons.types.quiz") },
        ],
      },
      {
        key: "status",
        label: t("lessons.filters.status"),
        type: "multiselect",
        icon: <ListFilter className="size-3.5" />,
        options: [
          { value: "draft", label: t("lessons.statuses.draft") },
          { value: "published", label: t("lessons.statuses.published") },
        ],
      },
      {
        key: "createdAt",
        label: t("lessons.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const lessons = data?.lessons ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("lessons.title")}</h1>
          <p className="text-muted-foreground">{t("lessons.description")}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("lessons.create.button")}
        </Button>
      </div>

      <DataTable
        data={lessons}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        emptyState={{
          title: t("lessons.empty.title"),
          description: t("lessons.empty.description"),
          action: (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              {t("lessons.create.button")}
            </Button>
          ),
        }}
      />

      <LessonDialog
        lesson={editLesson}
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
        onSubmit={handleSubmit}
        isPending={isPending}
      />

      <DeleteDialog
        open={!!deleteLesson}
        onOpenChange={(open) => !open && setDeleteLesson(null)}
        title={t("lessons.delete.title")}
        description={t("lessons.delete.description", {
          name: deleteLesson?.title,
        })}
        confirmValue={deleteLesson?.title ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={!!previewLesson} onOpenChange={(open) => !open && setPreviewLesson(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{previewLesson?.title}</DialogTitle>
          </DialogHeader>
          {previewLesson?.videoUrl && (
            <VideoPlayer className="w-full aspect-video">
              <VideoPlayerContent
                src={previewLesson.videoUrl}
                slot="media"
                crossOrigin="anonymous"
              />
              <VideoPlayerControlBar>
                <VideoPlayerPlayButton />
                <VideoPlayerSeekBackwardButton />
                <VideoPlayerSeekForwardButton />
                <VideoPlayerTimeRange />
                <VideoPlayerTimeDisplay showDuration />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeRange />
              </VideoPlayerControlBar>
            </VideoPlayer>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
