import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@learnbase/ui";
import { cn } from "@/lib/utils";

type ErrorPageProps = {
  error: Error;
  reset?: () => void;
  showDetails?: boolean;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  logo?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ErrorPage({
  error,
  reset,
  showDetails = false,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  logo,
  className,
  style,
}: ErrorPageProps) {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const errorTitle = title ?? t("errors.pageTitle");
  const errorDescription = description ?? t("errors.pageDescription");
  const buttonLabel = actionLabel ?? t("errors.tryAgain");

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (reset) {
      reset();
    } else if (actionHref) {
      window.location.href = actionHref;
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-background px-4",
        className
      )}
      style={style}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        {logo && <div className="mb-8">{logo}</div>}

        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">{errorTitle}</h1>
        <p className="mb-8 text-muted-foreground">{errorDescription}</p>

        <Button onClick={handleAction} className="gap-2">
          {reset && <RotateCcw className="size-4" />}
          {buttonLabel}
        </Button>

        {showDetails && error && (
          <div className="mt-8 w-full">
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {detailsOpen ? (
                <>
                  {t("errors.hideDetails")}
                  <ChevronUp className="size-4" />
                </>
              ) : (
                <>
                  {t("errors.showDetails")}
                  <ChevronDown className="size-4" />
                </>
              )}
            </button>

            {detailsOpen && (
              <div className="mt-4 overflow-hidden rounded-lg border bg-muted/50">
                <div className="max-h-64 overflow-auto p-4 text-left">
                  <p className="mb-2 font-mono text-sm font-medium text-destructive">
                    {error.name}: {error.message}
                  </p>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
