import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import { VideoContent } from "@/components/campus/content-viewer/video-content";
import { DocumentContent } from "@/components/campus/content-viewer/document-content";
import { useCampusPreviewContent } from "@/services/campus/queries";
import type { CampusModuleItem } from "@/services/campus/service";

type PreviewContentDialogProps = {
  item: CampusModuleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewContentDialog({
  item,
  open,
  onOpenChange,
}: PreviewContentDialogProps) {
  const { t } = useTranslation();
  const { data: content, isLoading } = useCampusPreviewContent(
    open && item ? item.id : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {content?.title || item?.title || t("campus.preview.title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="aspect-video w-full" />
        ) : content?.type === "video" ? (
          <VideoContent src={content.url ?? ""} className="overflow-hidden rounded-lg" />
        ) : content?.type === "document" ? (
          <DocumentContent
            src={content.url ?? ""}
            mimeType={content.mimeType ?? undefined}
            title={content.title}
          />
        ) : content?.type === "quiz" ? (
          <div className="space-y-4">
            {content.description && (
              <p className="text-muted-foreground">{content.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {t("campus.preview.quizPreviewNote")}
            </p>
            <div className="space-y-4">
              {content.questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border p-4">
                  <p className="mb-3 font-medium">
                    {index + 1}. {question.questionText}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span className="size-4 rounded-full border" />
                        <span>{option.optionText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
