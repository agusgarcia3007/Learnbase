import { useEffect, useRef, useState } from "react";
import { parseText, CaptionsRenderer as MediaCaptionsRenderer } from "media-captions";

type CaptionsRendererProps = {
  vttUrl: string | null;
  videoRef: HTMLVideoElement | null;
};

export function CaptionsRenderer({ vttUrl, videoRef }: CaptionsRendererProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MediaCaptionsRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!overlayRef.current) return;

    rendererRef.current = new MediaCaptionsRenderer(overlayRef.current);

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!vttUrl || !rendererRef.current) {
      rendererRef.current?.reset();
      setIsLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadCaptions() {
      const response = await fetch(vttUrl!);
      const text = await response.text();
      const { cues, regions } = await parseText(text, { type: "vtt" });

      if (cancelled || !rendererRef.current) return;

      rendererRef.current.changeTrack({ cues, regions });
      setIsLoaded(true);
    }

    loadCaptions();

    return () => {
      cancelled = true;
    };
  }, [vttUrl]);

  useEffect(() => {
    if (!videoRef || !rendererRef.current || !isLoaded) return;

    const handleTimeUpdate = () => {
      if (!rendererRef.current) return;
      rendererRef.current.currentTime = videoRef.currentTime;
      rendererRef.current.update();
    };

    videoRef.addEventListener("timeupdate", handleTimeUpdate);
    handleTimeUpdate();

    return () => {
      videoRef.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [videoRef, isLoaded]);

  return (
    <div
      ref={overlayRef}
      className="captions-overlay pointer-events-none absolute inset-0"
    />
  );
}
