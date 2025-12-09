import { VideoContent } from "./video-content";
import { DocumentContent } from "./document-content";
import { QuizContent, type Quiz } from "./quiz-content";
import { cn } from "@/lib/utils";

export type ContentType = "video" | "document" | "quiz";

type ContentViewerProps = {
  contentType: ContentType;
  contentUrl?: string;
  mimeType?: string;
  poster?: string;
  quiz?: Quiz;
  title?: string;
  onComplete?: () => void;
  onVideoTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
};

export function ContentViewer({
  contentType,
  contentUrl,
  mimeType,
  poster,
  quiz,
  title,
  onComplete,
  onVideoTimeUpdate,
  className,
}: ContentViewerProps) {
  switch (contentType) {
    case "video":
      if (!contentUrl) return null;
      return (
        <VideoContent
          src={contentUrl}
          poster={poster}
          onComplete={onComplete}
          onTimeUpdate={onVideoTimeUpdate}
          className={cn(className)}
        />
      );

    case "document":
      if (!contentUrl) return null;
      return (
        <DocumentContent
          src={contentUrl}
          mimeType={mimeType}
          title={title}
          onComplete={onComplete}
          className={cn(className)}
        />
      );

    case "quiz":
      if (!quiz) return null;
      return (
        <QuizContent
          quiz={quiz}
          onComplete={onComplete ? () => onComplete() : undefined}
          className={cn(className)}
        />
      );

    default:
      return null;
  }
}
