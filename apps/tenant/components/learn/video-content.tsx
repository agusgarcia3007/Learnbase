"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "@phosphor-icons/react";
import { formatDuration } from "@learnbase/shared";
import { Button } from "@/components/ui/button";
import type { VideoContent as VideoContentType } from "@/services/learn/service";

type VideoContentProps = {
  content: VideoContentType;
  onComplete: () => void;
  isCompleting: boolean;
};

export function VideoContent({ content, onComplete, isCompleting }: VideoContentProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = () => {
    onComplete();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 bg-black">
        {content.url ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full"
            src={content.url}
            controls
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/60">
            {t("learn.video.unavailable")}
          </div>
        )}
      </div>
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-semibold">{content.title}</h1>
          {content.description && (
            <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {formatDuration(content.duration)}
            </span>
            <Button
              onClick={onComplete}
              disabled={isCompleting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <CheckCircle className="size-4" />
              {t("learn.markComplete")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
