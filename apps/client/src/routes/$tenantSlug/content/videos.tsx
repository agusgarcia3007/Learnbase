import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Clock, Ellipsis, Plus, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@learnbase/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { Skeleton } from "@learnbase/ui";

import { DataTable, DeleteDialog } from "@/components/data-table";
import { VideoUpload } from "@/components/file-upload/video-upload";
import { SubtitleManager } from "@/components/videos/subtitle-manager";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useVideosList,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
  useConfirmVideoFile,
  useDeleteVideoFile,
  useConfirmVideoStandalone,
  type Video as VideoType,
} from "@/services/videos";
import { useAnalyzeVideo } from "@/services/ai";
import { createSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/$tenantSlug/content/videos")({
  head: () =>
    createSeoMeta({
      title: "Videos",
      description: "Manage your videos",
      noindex: true,
    }),
  component: VideosPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
    status: (search.status as string) || undefined,
  }),
});

const videoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type VideoFormData = z.infer<typeof videoSchema>;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VideosPage() {
  const { t } = useTranslation();
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useVideosList({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    sort: tableState.serverParams.sort,
    search: tableState.serverParams.search,
    status: tableState.serverParams.status as string | undefined,
    createdAt: tableState.serverParams.createdAt as string | undefined,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoType | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<VideoType | null>(null);
  const [pendingVideoKey, setPendingVideoKey] = useState<string | null>(null);
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [pendingFileSizeBytes, setPendingFileSizeBytes] = useState<number>(0);

  const createMutation = useCreateVideo();
  const updateMutation = useUpdateVideo();
  const deleteMutation = useDeleteVideo();
  const confirmMutation = useConfirmVideoFile();
  const deleteFileMutation = useDeleteVideoFile();
  const confirmStandaloneMutation = useConfirmVideoStandalone();
  const analyzeVideoMutation = useAnalyzeVideo();

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (editVideo) {
      form.reset({
        title: editVideo.title,
        description: editVideo.description ?? "",
        status: editVideo.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "draft",
      });
    }
  }, [editVideo, form]);

  const handleOpenCreate = useCallback(() => {
    setEditVideo(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((video: VideoType) => {
    setEditVideo(video);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback((open: boolean) => {
    if (!open) {
      setEditorOpen(false);
      setEditVideo(null);
      setPendingVideoKey(null);
      setPendingVideoUrl(null);
      setPendingDuration(0);
      form.reset();
    }
  }, [form]);

  const handleSubmit = useCallback(
    (values: VideoFormData) => {
      if (editVideo) {
        updateMutation.mutate(
          { id: editVideo.id, ...values },
          { onSuccess: () => handleCloseEditor(false) }
        );
      } else {
        createMutation.mutate(
          {
            ...values,
            videoKey: pendingVideoKey ?? undefined,
            duration: pendingDuration,
            fileSizeBytes: pendingFileSizeBytes || undefined,
          },
          {
            onSuccess: () => handleCloseEditor(false),
          }
        );
      }
    },
    [editVideo, createMutation, updateMutation, handleCloseEditor, pendingVideoKey, pendingDuration, pendingFileSizeBytes]
  );

  const handleDelete = useCallback(() => {
    if (!deleteVideo) return;
    deleteMutation.mutate(deleteVideo.id, {
      onSuccess: () => setDeleteVideo(null),
    });
  }, [deleteVideo, deleteMutation]);

  const handleConfirmVideo = useCallback(
    async ({ key, duration, fileSizeBytes }: { key: string; duration: number; fileSizeBytes: number }) => {
      if (!editVideo) return "";
      const result = await confirmMutation.mutateAsync({
        id: editVideo.id,
        key,
        duration,
        fileSizeBytes,
      });
      return result.video.videoUrl ?? "";
    },
    [editVideo, confirmMutation]
  );

  const handleDeleteVideoFile = useCallback(async () => {
    if (!editVideo) return;
    await deleteFileMutation.mutateAsync(editVideo.id);
    setEditVideo({ ...editVideo, videoKey: null, videoUrl: null });
  }, [editVideo, deleteFileMutation]);

  const handleConfirmVideoStandalone = useCallback(
    async ({ key, duration, fileSizeBytes }: { key: string; duration: number; fileSizeBytes: number }) => {
      const result = await confirmStandaloneMutation.mutateAsync(key);
      setPendingVideoKey(result.videoKey);
      setPendingVideoUrl(result.videoUrl);
      setPendingDuration(duration);
      setPendingFileSizeBytes(fileSizeBytes);
      return result.videoUrl;
    },
    [confirmStandaloneMutation]
  );

  const handleDeletePendingVideo = useCallback(async () => {
    setPendingVideoKey(null);
    setPendingVideoUrl(null);
    setPendingDuration(0);
    setPendingFileSizeBytes(0);
  }, []);

  const hasVideo = editVideo?.videoKey || pendingVideoKey;

  const handleAnalyzeVideo = useCallback(() => {
    const videoKey = editVideo?.videoKey || pendingVideoKey;
    if (!videoKey) {
      toast.error(t("ai.errors.noVideo"));
      return;
    }
    analyzeVideoMutation.mutate(
      { videoKey, videoId: editVideo?.id },
      {
        onSuccess: (data) => {
          form.setValue("title", data.title);
          form.setValue("description", data.description);
          toast.success(t("ai.analyzeSuccess"));
        },
      }
    );
  }, [editVideo, pendingVideoKey, analyzeVideoMutation, form, t]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns = useMemo<ColumnDef<VideoType>[]>(
    () => [
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("videos.columns.title")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="space-y-px">
            <div className="font-medium text-foreground">{row.original.title}</div>
            {row.original.description && (
              <div className="text-muted-foreground text-xs line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
        size: 300,
        enableSorting: true,
        meta: {
          headerTitle: t("videos.columns.title"),
          skeleton: (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          ),
        },
      },
      {
        accessorKey: "duration",
        id: "duration",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("videos.columns.duration")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatDuration(row.original.duration)}
          </span>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("videos.columns.duration"),
          skeleton: <Skeleton className="h-4 w-16" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("videos.columns.status")}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "published" ? "success" : "secondary"}
            size="sm"
          >
            {t(`videos.statuses.${row.original.status}`)}
          </Badge>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          headerTitle: t("videos.columns.status"),
          skeleton: <Skeleton className="h-5 w-16" />,
        },
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("videos.columns.createdAt")}
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
          headerTitle: t("videos.columns.createdAt"),
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
                onClick={() => setDeleteVideo(row.original)}
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
    [t, handleOpenEdit]
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "status",
        label: t("videos.filters.status"),
        type: "select",
        icon: <Video className="size-3.5" />,
        options: [
          { label: t("videos.statuses.draft"), value: "draft" },
          { label: t("videos.statuses.published"), value: "published" },
        ],
      },
      {
        key: "createdAt",
        label: t("videos.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const videos = data?.videos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("videos.title")}</h1>
          <p className="text-muted-foreground">{t("videos.description")}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {t("videos.create.button")}
        </Button>
      </div>

      <DataTable
        data={videos}
        columns={columns}
        pagination={data?.pagination}
        isLoading={isLoading}
        tableState={tableState}
        filterFields={filterFields}
        emptyState={{
          title: t("videos.empty.title"),
          description: t("videos.empty.description"),
          action: (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              {t("videos.create.button")}
            </Button>
          ),
        }}
      />

      <Dialog open={editorOpen} onOpenChange={handleCloseEditor}>
        <DialogContent className="max-w-2xl">
          {analyzeVideoMutation.isPending && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/90 backdrop-blur-sm">
              <div className="h-2 w-48 overflow-hidden rounded-full bg-primary/20">
                <div className="h-full w-1/2 animate-[shimmer-slide_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
              </div>
              <p className="text-sm font-medium text-primary">
                {t("ai.analyzing")}
              </p>
            </div>
          )}
          <DialogHeader>
            <DialogTitle>
              {editVideo
                ? t("videos.edit.title")
                : t("videos.create.title")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="contents">
              <DialogBody className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("videos.form.title")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>{t("videos.form.description")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasVideo || analyzeVideoMutation.isPending}
                  isLoading={analyzeVideoMutation.isPending}
                  onClick={handleAnalyzeVideo}
                  className="w-full"
                >
                  <Sparkles className="size-4" />
                  {t("ai.analyzeVideo")}
                </Button>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("videos.form.status")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">
                            {t("videos.statuses.draft")}
                          </SelectItem>
                          <SelectItem value="published">
                            {t("videos.statuses.published")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>{t("videos.form.video")}</FormLabel>
                  <VideoUpload
                    value={editVideo ? editVideo.videoUrl : pendingVideoUrl}
                    onChange={() => {}}
                    onConfirm={editVideo ? handleConfirmVideo : handleConfirmVideoStandalone}
                    onDelete={editVideo ? handleDeleteVideoFile : handleDeletePendingVideo}
                    folder="videos"
                    isConfirming={editVideo ? confirmMutation.isPending : confirmStandaloneMutation.isPending}
                    isDeleting={deleteFileMutation.isPending}
                    maxSize={250 * 1024 * 1024}
                  />
                </FormItem>
                {editVideo?.videoKey && (
                  <div className="rounded-lg border p-4">
                    <SubtitleManager videoId={editVideo.id} />
                  </div>
                )}
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCloseEditor(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {editVideo ? t("common.save") : t("common.create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteVideo}
        onOpenChange={(open) => !open && setDeleteVideo(null)}
        title={t("videos.delete.title")}
        description={t("videos.delete.description", {
          name: deleteVideo?.title,
        })}
        confirmValue={deleteVideo?.title ?? ""}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
