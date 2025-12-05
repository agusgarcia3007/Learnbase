import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  useUploadFile,
  type CreateLessonRequest,
  type Lesson,
  type LessonType,
  type UpdateLessonRequest,
} from "@/services/lessons";
import { VideoUpload } from "./video-upload";
import { DocumentUpload } from "@/components/file-upload/document-upload";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["video", "file", "quiz"]),
  isPreview: z.boolean(),
  status: z.enum(["draft", "published"]),
});

type FormData = z.infer<typeof schema>;

const LESSON_TYPES: LessonType[] = ["video", "file", "quiz"];

type LessonDialogProps = {
  lesson?: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLessonRequest | UpdateLessonRequest) => void;
  isPending?: boolean;
};

export function LessonDialog({
  lesson,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: LessonDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!lesson;
  const uploadFileMutation = useUploadFile();

  const [videoData, setVideoData] = useState<{
    videoKey: string;
    duration: number;
  } | null>(null);
  const [hasExistingVideo, setHasExistingVideo] = useState(false);
  const [shouldDeleteVideo, setShouldDeleteVideo] = useState(false);

  const [fileData, setFileData] = useState<{
    fileKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);
  const [hasExistingFile, setHasExistingFile] = useState(false);
  const [shouldDeleteFile, setShouldDeleteFile] = useState(false);

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
      type: "video",
      isPreview: false,
      status: "draft",
    },
  });

  const currentType = watch("type");
  const currentStatus = watch("status");
  const currentIsPreview = watch("isPreview");

  useEffect(() => {
    if (open) {
      if (lesson) {
        reset({
          title: lesson.title,
          description: lesson.description || "",
          type: lesson.type,
          isPreview: lesson.isPreview,
          status: lesson.status,
        });
        setHasExistingVideo(!!lesson.videoUrl);
        setHasExistingFile(!!lesson.fileUrl);
      } else {
        reset({
          title: "",
          description: "",
          type: "video",
          isPreview: false,
          status: "draft",
        });
        setHasExistingVideo(false);
        setHasExistingFile(false);
      }
      setVideoData(null);
      setShouldDeleteVideo(false);
      setFileData(null);
      setShouldDeleteFile(false);
    }
  }, [lesson, open, reset]);

  const handleFormSubmit = (data: FormData) => {
    const payload: CreateLessonRequest | UpdateLessonRequest = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      isPreview: data.isPreview,
      status: data.status,
      ...(videoData && {
        videoKey: videoData.videoKey,
        duration: videoData.duration,
      }),
      ...(shouldDeleteVideo && !videoData && { videoKey: null, duration: 0 }),
      ...(fileData && {
        fileKey: fileData.fileKey,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
      }),
      ...(shouldDeleteFile &&
        !fileData && {
          fileKey: null,
          fileName: null,
          fileSize: null,
          mimeType: null,
        }),
    };

    onSubmit(payload);
  };

  const handleVideoUploaded = (data: {
    videoKey: string;
    videoUrl: string;
    duration: number;
  }) => {
    setVideoData({ videoKey: data.videoKey, duration: data.duration });
  };

  const handleVideoRemove = () => {
    setVideoData(null);
    setHasExistingVideo(false);
    setShouldDeleteVideo(true);
  };

  const handleFileUploaded = (data: {
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) => {
    setFileData({
      fileKey: data.fileKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    });
  };

  const handleFileRemove = () => {
    setFileData(null);
    setHasExistingFile(false);
    setShouldDeleteFile(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("lessons.edit.title") : t("lessons.create.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("lessons.edit.description")
              : t("lessons.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">{t("lessons.fields.title")}</Label>
              <Input
                id="title"
                {...register("title")}
                disabled={isPending}
                placeholder={t("lessons.fields.titlePlaceholder")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">
                {t("lessons.fields.description")}
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                disabled={isPending}
                placeholder={t("lessons.fields.descriptionPlaceholder")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t("lessons.fields.type")}</Label>
              <Select
                value={currentType}
                onValueChange={(value) => setValue("type", value as LessonType)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`lessons.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div className="space-y-0.5">
                <Label htmlFor="status">{t("lessons.fields.publish")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("lessons.fields.publishDescription")}
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

            {currentType === "video" && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="isPreview"
                  checked={currentIsPreview}
                  onCheckedChange={(checked) => setValue("isPreview", !!checked)}
                  disabled={isPending}
                />
                <Label
                  htmlFor="isPreview"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("lessons.fields.isPreview")}
                </Label>
              </div>
            )}
          </div>

          {currentType === "video" && (
            <div className="space-y-2">
              <Label>{t("lessons.fields.video")}</Label>
              <VideoUpload
                existingVideoUrl={hasExistingVideo ? lesson?.videoUrl : null}
                existingDuration={lesson?.duration}
                disabled={isPending}
                onVideoUploaded={handleVideoUploaded}
                onVideoRemove={handleVideoRemove}
              />
            </div>
          )}

          {currentType === "file" && (
            <div className="space-y-2">
              <Label>{t("lessons.fields.file")}</Label>
              <DocumentUpload
                value={
                  fileData
                    ? fileData.fileKey
                    : hasExistingFile
                      ? lesson?.fileUrl
                      : null
                }
                fileName={fileData?.fileName || lesson?.fileName}
                fileSize={fileData?.fileSize || lesson?.fileSize}
                mimeType={fileData?.mimeType || lesson?.mimeType}
                onChange={() => {}}
                onUpload={async (base64, fileName, fileSize) => {
                  const result = await uploadFileMutation.mutateAsync({
                    file: base64,
                    fileName,
                    fileSize,
                  });
                  handleFileUploaded({
                    fileKey: result.fileKey,
                    fileUrl: result.fileUrl,
                    fileName: result.fileName,
                    fileSize: result.fileSize,
                    mimeType: result.mimeType,
                  });
                  return result.fileUrl;
                }}
                onDelete={async () => {
                  handleFileRemove();
                }}
                disabled={isPending}
                isUploading={uploadFileMutation.isPending}
              />
            </div>
          )}

          {currentType === "quiz" && (
            <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
              <p className="text-sm">{t("lessons.quiz.createFirst")}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
