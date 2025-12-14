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
  VideoPlayerFullscreenButton,
  VideoPlayerCaptionsButton,
} from "@/components/kibo-ui/video-player";
import { cn } from "@/lib/utils";

export type SubtitleTrack = {
  language: string;
  label: string;
  vttUrl: string;
};

type VideoContentProps = {
  src: string;
  poster?: string;
  initialTime?: number;
  subtitles?: SubtitleTrack[];
  defaultSubtitleLang?: string;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: (currentTime: number) => void;
  onSeeked?: (currentTime: number) => void;
  onVideoRefReady?: (ref: HTMLVideoElement | null) => void;
  className?: string;
};

export function VideoContent({
  src,
  poster,
  initialTime,
  subtitles = [],
  defaultSubtitleLang,
  onComplete,
  onTimeUpdate,
  onPause,
  onSeeked,
  onVideoRefReady,
  className,
}: VideoContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCalledComplete = useRef(false);
  const hasSetInitialTime = useRef(false);
  const hasUserSeeked = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialTime || hasSetInitialTime.current || hasUserSeeked.current) return;

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
    hasUserSeeked.current = false;
  }, [src]);

  useEffect(() => {
    onVideoRefReady?.(videoRef.current);
    return () => onVideoRefReady?.(null);
  }, [onVideoRefReady]);

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

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    hasUserSeeked.current = true;
    onSeeked?.(video.currentTime);
  }, [onSeeked]);

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
        onSeeked={handleSeeked}
      >
        {subtitles.map((track) => (
          <track
            key={track.language}
            kind="subtitles"
            srcLang={track.language}
            label={track.label}
            src={track.vttUrl}
            default={track.language === defaultSubtitleLang}
          />
        ))}
      </VideoPlayerContent>
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerVolumeRange />
        <VideoPlayerMuteButton />
        {subtitles.length > 0 && <VideoPlayerCaptionsButton />}
        <VideoPlayerFullscreenButton />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}
