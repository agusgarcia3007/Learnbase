import { useState, useCallback } from "react";
import { UploadsService, type UploadFolder } from "@/services/uploads/service";

type DirectUploadOptions = {
  folder: UploadFolder;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
};

type UploadResult = {
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export function useDirectUpload({ folder, onProgress, onError }: DirectUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);

      try {
        const { uploadUrl, key } = await UploadsService.getPresignedUrl({
          folder,
          fileName: file.name,
          contentType: file.type,
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.timeout = 10 * 60 * 1000;

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
              onProgress?.(pct);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.ontimeout = () => reject(new Error("Upload timed out"));
          xhr.onabort = () => reject(new Error("Upload cancelled"));
          xhr.send(file);
        });

        setIsUploading(false);
        setProgress(100);

        return {
          key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };
      } catch (error) {
        setIsUploading(false);
        setProgress(0);
        const err = error instanceof Error ? error : new Error("Upload failed");
        onError?.(err);
        throw err;
      }
    },
    [folder, onProgress, onError]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
  }, []);

  return { upload, isUploading, progress, reset };
}
