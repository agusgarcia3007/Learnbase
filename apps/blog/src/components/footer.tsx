import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black/20 backdrop-blur-lg">
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden">
        <span
          className="translate-y-[35%] select-none text-[14vw] font-bold leading-none tracking-tighter text-foreground/[0.03] dark:text-foreground/[0.04] md:text-[16vw]"
          aria-hidden="true"
        >
          learnbase
        </span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6">
          <a
            href="https://uselearnbase.com"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <img
              src="/logos/blue.png"
              alt="Learnbase"
              className="size-8 rounded-md"
            />
            <span className="text-lg font-semibold">{t("header.title")}</span>
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="https://uselearnbase.com"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.goToApp")}
            </a>
          </nav>
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
