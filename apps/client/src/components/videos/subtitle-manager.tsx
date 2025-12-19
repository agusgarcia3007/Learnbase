import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@learnbase/ui";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useVideoSubtitles } from "@/services/subtitles/queries";
import {
  useGenerateSubtitles,
  useTranslateSubtitles,
  useDeleteSubtitle,
} from "@/services/subtitles/mutations";
import { LANGUAGE_OPTIONS, getLanguageLabel } from "@/lib/languages";
import { Loader2, Check, AlertCircle, Languages, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SubtitleManagerProps = {
  videoId: string;
};

export function SubtitleManager({ videoId }: SubtitleManagerProps) {
  const { t } = useTranslation();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const { data, isLoading } = useVideoSubtitles(videoId);
  const generateMutation = useGenerateSubtitles(videoId);
  const translateMutation = useTranslateSubtitles(videoId);
  const deleteMutation = useDeleteSubtitle(videoId);

  const subtitles = data?.subtitles || [];
  const original = subtitles.find((s) => s.isOriginal);
  const hasOriginal = original?.status === "completed";
  const isGenerating =
    original?.status === "processing" || original?.status === "pending";

  const availableTranslations = LANGUAGE_OPTIONS.filter(
    (lang) =>
      !subtitles.some((s) => s.language === lang.value && s.status !== "failed")
  );

  const handleGenerateWithLanguage = (language: string) => {
    generateMutation.mutate(language);
    setGenerateOpen(false);
  };

  const handleTranslate = (language: string) => {
    translateMutation.mutate(language);
    setTranslateOpen(false);
  };

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
          <Popover open={generateOpen} onOpenChange={setGenerateOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={generateMutation.isPending}
              >
                <Languages className="mr-2 h-4 w-4" />
                {t("subtitles.generate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput placeholder={t("subtitles.searchLanguage")} />
                <CommandList className="max-h-[200px]">
                  <CommandEmpty>{t("subtitles.noResults")}</CommandEmpty>
                  <CommandGroup>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <CommandItem
                        key={lang.value}
                        value={lang.label}
                        onPointerDown={(e) => e.preventDefault()}
                        onSelect={() => handleGenerateWithLanguage(lang.value)}
                      >
                        {lang.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {isGenerating && !original && (
        <div className="space-y-2">
          <div className="relative flex items-center justify-between rounded-md border p-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("subtitles.status.processing")}
              </span>
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-muted/50 to-transparent animate-shimmer" />
          </div>
        </div>
      )}

      {subtitles.length > 0 && (
        <div className="space-y-2">
          {subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              className={cn(
                "flex items-center justify-between rounded-md border p-3",
                subtitle.status === "failed" &&
                  "border-destructive/50 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {getLanguageLabel(subtitle.language)}
                </span>
                {subtitle.isOriginal && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t("subtitles.original")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={subtitle.status}
                  errorMessage={subtitle.errorMessage}
                />
                {(subtitle.status === "completed" ||
                  subtitle.status === "failed") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(subtitle.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
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
        <Popover open={translateOpen} onOpenChange={setTranslateOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={translateMutation.isPending}
            >
              {translateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              {t("subtitles.translate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("subtitles.searchLanguage")} />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>{t("subtitles.noResults")}</CommandEmpty>
                <CommandGroup>
                  {availableTranslations.map((lang) => (
                    <CommandItem
                      key={lang.value}
                      value={lang.label}
                      onPointerDown={(e) => e.preventDefault()}
                      onSelect={() => handleTranslate(lang.value)}
                    >
                      {lang.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
