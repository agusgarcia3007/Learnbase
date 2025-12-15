import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Languages, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type AvailableSubtitle = {
  language: string;
  label: string;
};

type SubtitleSelectorProps = {
  availableSubtitles: AvailableSubtitle[];
  selectedLanguage: string | null;
  isLoading?: boolean;
  onSelect?: (language: string | null) => void;
};

export function SubtitleSelector({
  availableSubtitles,
  selectedLanguage,
  isLoading,
  onSelect,
}: SubtitleSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleSelect = (language: string | null) => {
    onSelect?.(language);
    setOpen(false);
  };

  if (availableSubtitles.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center p-2.5",
            "text-white hover:bg-white/20",
            "rounded transition-colors",
            isLoading && "pointer-events-none opacity-50"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Languages className="h-5 w-5" />
          )}
          {selectedLanguage && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end" side="top">
        <Command>
          <CommandInput placeholder={t("subtitles.searchLanguage")} />
          <CommandList>
            <CommandEmpty>{t("subtitles.noResults")}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null)}
                className={cn(!selectedLanguage && "bg-accent")}
              >
                {t("subtitles.off")}
                {!selectedLanguage && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
              {availableSubtitles.map((sub) => (
                <CommandItem
                  key={sub.language}
                  value={sub.label}
                  onSelect={() => handleSelect(sub.language)}
                  className={cn(selectedLanguage === sub.language && "bg-accent")}
                >
                  {sub.label}
                  {selectedLanguage === sub.language && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
