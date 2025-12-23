import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { useTranslation } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "light" as const, labelKey: "theme.light", icon: Sun },
    { value: "dark" as const, labelKey: "theme.dark", icon: Moon },
    { value: "system" as const, labelKey: "theme.system", icon: Monitor },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("theme.toggle")}
      >
        <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-32 overflow-hidden rounded-md border border-border bg-background shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                theme === option.value
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <option.icon className="size-4" />
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
