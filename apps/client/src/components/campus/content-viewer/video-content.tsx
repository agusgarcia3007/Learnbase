import { useRef, useCallback, useEffect } from "react";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerPlayButton,
  VideoPlayerMuteButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeRange,
  VideoPlayerTimeDisplay,
  VideoPlayerVolumeRange,
} from "@/components/kibo-ui/video-player";
import { cn } from "@/lib/utils";

type VideoContentProps = {
  src: string;
  poster?: string;
  initialTime?: number;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: (currentTime: number) => void;
  className?: string;
};

export function VideoContent({
  src,
  poster,
  initialTime,
  onComplete,
  onTimeUpdate,
  onPause,
  className,
}: VideoContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCalledComplete = useRef(false);
  const hasSetInitialTime = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialTime || hasSetInitialTime.current) return;

    const setTime = () => {
      if (video.readyState >= 1 && initialTime > 0) {
        video.currentTime = initialTime;
        hasSetInitialTime.current = true;
      }
    };

    if (video.readyState >= 1) {
      setTime();
    } else {
      video.addEventListener("loadedmetadata", setTime, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", setTime);
    };
  }, [initialTime, src]);

  useEffect(() => {
    hasCalledComplete.current = false;
    hasSetInitialTime.current = false;
  }, [src]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    onTimeUpdate?.(video.currentTime, video.duration);

    if (
      !hasCalledComplete.current &&
      video.duration > 0 &&
      video.currentTime >= video.duration * 0.9
    ) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [onComplete, onTimeUpdate]);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    onPause?.(video.currentTime);
  }, [onPause]);

  const handleEnded = useCallback(() => {
    if (!hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  return (
    <VideoPlayer className={cn("aspect-video w-full rounded-lg", className)}>
      <VideoPlayerContent
        ref={videoRef}
        src={src}
        poster={poster}
        slot="media"
        crossOrigin="anonymous"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onEnded={handleEnded}
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerVolumeRange />
        <VideoPlayerMuteButton />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}
