"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  DotsThree,
  Pencil,
  Trash,
  VideoCamera,
  Clock,
  SpinnerGap,
} from "@phosphor-icons/react";
import { formatDuration } from "@learnbase/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useVideos,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
  type Video,
  type VideoStatus,
} from "@/services/videos";

const videoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type VideoFormData = z.infer<typeof videoSchema>;

const STATUS_VARIANTS: Record<VideoStatus, "default" | "secondary"> = {
  published: "default",
  draft: "secondary",
};

export default function VideosPage() {
  const { t } = useTranslation();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<Video | null>(null);

  const { data, isLoading } = useVideos();
  const createMutation = useCreateVideo();
  const updateMutation = useUpdateVideo();
  const deleteMutation = useDeleteVideo();

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

  const handleOpenCreate = () => {
    setEditVideo(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (video: Video) => {
    setEditVideo(video);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditVideo(null);
    form.reset();
  };

  const handleSubmit = (values: VideoFormData) => {
    if (editVideo) {
      updateMutation.mutate(
        { id: editVideo.id, ...values },
        { onSuccess: handleCloseEditor }
      );
    } else {
      createMutation.mutate(values, { onSuccess: handleCloseEditor });
    }
  };

  const handleDelete = () => {
    if (!deleteVideo) return;
    deleteMutation.mutate(deleteVideo.id, {
      onSuccess: () => setDeleteVideo(null),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const videos = data?.videos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("videos.title")}</h1>
          <p className="text-muted-foreground">{t("videos.description")}</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="size-4" />
          {t("videos.create.button")}
        </Button>
      </div>

      {isLoading ? (
        <VideosTableSkeleton />
      ) : videos.length === 0 ? (
        <EmptyState onCreateClick={handleOpenCreate} />
      ) : (
        <div className="rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("videos.columns.title")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("videos.columns.duration")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("videos.columns.status")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("videos.columns.createdAt")}
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{video.title}</div>
                      {video.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {video.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatDuration(video.duration)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[video.status]}>
                      {t(`videos.statuses.${video.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                        <DotsThree className="size-5" weight="bold" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(video)}>
                          <Pencil className="mr-2 size-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteVideo(video)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 size-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => !open && handleCloseEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editVideo ? t("videos.edit.title") : t("videos.create.title")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("videos.form.title")}</Label>
              <Input
                id="title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("videos.form.description")}</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("videos.form.status")}</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t("videos.statuses.draft")}</SelectItem>
                      <SelectItem value="published">{t("videos.statuses.published")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEditor}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <SpinnerGap className="mr-2 size-4 animate-spin" />}
                {editVideo ? t("common.save") : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteVideo} onOpenChange={(open) => !open && setDeleteVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("videos.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("videos.delete.description", { name: deleteVideo?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <SpinnerGap className="mr-2 size-4 animate-spin" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <VideoCamera className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{t("videos.empty.title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("videos.empty.description")}
      </p>
      <Button onClick={onCreateClick} className="mt-4 gap-2">
        <Plus className="size-4" />
        {t("videos.create.button")}
      </Button>
    </div>
  );
}

function VideosTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
              <td className="px-4 py-3"><Skeleton className="size-8" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
