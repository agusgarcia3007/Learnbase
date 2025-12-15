import { useState, useMemo } from "react";
import { VideoContent, type SubtitleTrack } from "./video-content";

type AvailableSubtitle = {
  language: string;
  label: string;
  vttUrl: string | null;
};

type VideoContentWithSubtitlesProps = {
  src: string;
  poster?: string;
  initialTime?: number;
  availableSubtitles: AvailableSubtitle[];
  defaultSubtitleLang?: string;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: (currentTime: number) => void;
  onSeeked?: (currentTime: number) => void;
  onVideoRefReady?: (ref: HTMLVideoElement | null) => void;
  className?: string;
};

export function VideoContentWithSubtitles({
  availableSubtitles,
  defaultSubtitleLang,
  ...props
}: VideoContentWithSubtitlesProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    defaultSubtitleLang || null
  );

  const loadedSubtitle: SubtitleTrack | null = useMemo(() => {
    if (!selectedLanguage) return null;

    const track = availableSubtitles.find(
      (s) => s.language === selectedLanguage
    );
    if (!track?.vttUrl) return null;

    return {
      language: track.language,
      label: track.label,
      vttUrl: track.vttUrl,
    };
  }, [selectedLanguage, availableSubtitles]);

  return (
    <VideoContent
      {...props}
      availableSubtitles={availableSubtitles}
      loadedSubtitle={loadedSubtitle}
      onSubtitleSelect={setSelectedLanguage}
      selectedSubtitleLang={selectedLanguage}
    />
  );
}
