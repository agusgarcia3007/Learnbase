import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const languages = ["en", "es", "pt"] as const;

type LanguageToggleProps = {
  variant?: ButtonProps["variant"];
  className?: string;
};

export function LanguageToggle({
  variant = "outline",
  className,
}: LanguageToggleProps) {
  const { i18n, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn("size-8", className)}
        >
          <Globe className="size-4" />
          <span className="sr-only">{t("header.toggleLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => i18n.changeLanguage(lang)}
            className={cn(i18n.language === lang && "bg-accent")}
          >
            {t(`header.language.${lang}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
