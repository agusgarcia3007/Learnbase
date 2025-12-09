import { useCallback, useRef } from "react";
import { useUpdateProgress } from "@/services/learn";

const SAVE_INTERVAL = 10;

export function useVideoProgress(moduleItemId: string) {
  const { mutate: saveProgress } = useUpdateProgress();
  const lastSavedRef = useRef(0);
  const hasMarkedInProgressRef = useRef(false);

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!hasMarkedInProgressRef.current && currentTime > 0) {
        hasMarkedInProgressRef.current = true;
        saveProgress({
          moduleItemId,
          payload: { status: "in_progress", videoProgress: Math.floor(currentTime) },
        });
        lastSavedRef.current = currentTime;
        return;
      }

      if (Math.abs(currentTime - lastSavedRef.current) >= SAVE_INTERVAL) {
        lastSavedRef.current = currentTime;
        saveProgress({
          moduleItemId,
          payload: { videoProgress: Math.floor(currentTime) },
        });
      }
    },
    [moduleItemId, saveProgress]
  );

  const handlePause = useCallback(
    (currentTime: number) => {
      if (Math.floor(currentTime) !== Math.floor(lastSavedRef.current)) {
        lastSavedRef.current = currentTime;
        saveProgress({
          moduleItemId,
          payload: { videoProgress: Math.floor(currentTime) },
        });
      }
    },
    [moduleItemId, saveProgress]
  );

  const reset = useCallback(() => {
    lastSavedRef.current = 0;
    hasMarkedInProgressRef.current = false;
  }, []);

  return { handleTimeUpdate, handlePause, reset };
}
