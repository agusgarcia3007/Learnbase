import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useVideoSubtitles } from "@/services/subtitles/queries";
import {
  useGenerateSubtitles,
  useTranslateSubtitles,
} from "@/services/subtitles/mutations";
import {
  LANGUAGE_LABELS,
  type SubtitleLanguage,
} from "@/services/subtitles/service";
import { Loader2, Check, AlertCircle, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

type SubtitleManagerProps = {
  videoId: string;
};

const ALL_LANGUAGES: SubtitleLanguage[] = ["en", "es", "pt"];

export function SubtitleManager({ videoId }: SubtitleManagerProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useVideoSubtitles(videoId);
  const generateMutation = useGenerateSubtitles(videoId);
  const translateMutation = useTranslateSubtitles(videoId);

  const subtitles = data?.subtitles || [];
  const original = subtitles.find((s) => s.isOriginal);
  const hasOriginal = original?.status === "completed";
  const isGenerating =
    original?.status === "processing" || original?.status === "pending";

  const availableTranslations = ALL_LANGUAGES.filter(
    (lang) =>
      !subtitles.some((s) => s.language === lang && s.status !== "failed")
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("subtitles.title")}</h4>
        {!hasOriginal && !isGenerating && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-2 h-4 w-4" />
            )}
            {t("subtitles.generate")}
          </Button>
        )}
      </div>

      {subtitles.length > 0 && (
        <div className="space-y-2">
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              className={cn(
                "flex items-center justify-between rounded-md border p-3",
                subtitle.status === "failed" && "border-destructive/50 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {LANGUAGE_LABELS[subtitle.language]}
                </span>
                {subtitle.isOriginal && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t("subtitles.original")}
                  </span>
                )}
              </div>
              <StatusBadge
                status={subtitle.status}
                errorMessage={subtitle.errorMessage}
              />
            </div>
          ))}
        </div>
      )}

      {subtitles.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("subtitles.noSubtitles")}
        </p>
      )}

      {hasOriginal && availableTranslations.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-sm text-muted-foreground">
            {t("subtitles.translateTo")}:
          </span>
          {availableTranslations.map((lang) => (
            <Button
              key={lang}
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => translateMutation.mutate(lang)}
              disabled={translateMutation.isPending}
            >
              {translateMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              {LANGUAGE_LABELS[lang]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  errorMessage,
}: {
  status: string;
  errorMessage: string | null;
}) {
  const { t } = useTranslation();

  switch (status) {
    case "completed":
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Check className="h-4 w-4" />
          <span className="text-xs">{t("subtitles.status.completed")}</span>
        </div>
      );
    case "processing":
    case "pending":
      return (
        <div className="flex items-center gap-1 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">{t("subtitles.status.processing")}</span>
        </div>
      );
    case "failed":
      return (
        <div
          className="flex items-center gap-1 text-destructive"
          title={errorMessage || undefined}
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">{t("subtitles.status.failed")}</span>
        </div>
      );
    default:
      return null;
  }
}
