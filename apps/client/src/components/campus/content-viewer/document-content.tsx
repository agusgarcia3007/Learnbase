import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FileText, ZoomIn, ZoomOut, Download, CheckCircle } from "lucide-react";
import { Button } from "@learnbase/ui";
import { cn } from "@/lib/utils";

type DocumentContentProps = {
  src: string;
  mimeType?: string;
  title?: string;
  autoComplete?: boolean;
  onComplete?: () => void;
  className?: string;
};

function isPdf(mimeType?: string): boolean {
  return mimeType === "application/pdf";
}

function isImage(mimeType?: string): boolean {
  return mimeType?.startsWith("image/") ?? false;
}

export function DocumentContent({
  src,
  mimeType,
  title,
  autoComplete,
  onComplete,
  className,
}: DocumentContentProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const hasAutoCompleted = useRef(false);

  useEffect(() => {
    if (autoComplete && onComplete && !hasAutoCompleted.current) {
      hasAutoCompleted.current = true;
       
      setIsCompleted(true);
      onComplete();
    }
  }, [autoComplete, onComplete]);

  useEffect(() => {
    hasAutoCompleted.current = false;
     
    setIsCompleted(false);
  }, [src]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50));
  }, []);

  const handleMarkComplete = useCallback(() => {
    setIsCompleted(true);
    onComplete?.();
  }, [onComplete]);

  const handleDownload = useCallback(() => {
    window.open(src, "_blank");
  }, [src]);

  if (isPdf(mimeType)) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            {title && <span>{title}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1 size-4" />
              {t("common.download")}
            </Button>
            {!isCompleted && onComplete && (
              <Button size="sm" onClick={handleMarkComplete}>
                <CheckCircle className="mr-1 size-4" />
                {t("contentViewer.markComplete")}
              </Button>
            )}
          </div>
        </div>
        <iframe
          src={`${src}#toolbar=1&navpanes=0`}
          className="h-[70vh] w-full rounded-lg border bg-muted"
          title={title || "PDF Document"}
        />
      </div>
    );
  }

  if (isImage(mimeType)) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            {title && <span>{title}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1 size-4" />
              {t("common.download")}
            </Button>
            {!isCompleted && onComplete && (
              <Button size="sm" onClick={handleMarkComplete}>
                <CheckCircle className="mr-1 size-4" />
                {t("contentViewer.markComplete")}
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-auto rounded-lg border bg-muted p-4">
          <img
            src={src}
            alt={title || "Document"}
            className="mx-auto transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          {title && <span>{title}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1 size-4" />
            {t("common.download")}
          </Button>
          {!isCompleted && onComplete && (
            <Button size="sm" onClick={handleMarkComplete}>
              <CheckCircle className="mr-1 size-4" />
              {t("contentViewer.markComplete")}
            </Button>
          )}
        </div>
      </div>
      <div className="flex h-[50vh] items-center justify-center rounded-lg border bg-muted">
        <div className="text-center">
          <FileText className="mx-auto mb-2 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t("contentViewer.unsupportedFormat")}
          </p>
          <Button variant="link" onClick={handleDownload}>
            {t("contentViewer.downloadToView")}
          </Button>
        </div>
      </div>
    </div>
  );
}
