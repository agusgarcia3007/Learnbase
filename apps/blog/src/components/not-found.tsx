import { Link } from '@tanstack/react-router';
import { useTranslation } from '@/lib/i18n';

export function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">{t("notFound.code")}</h1>
      <h2 className="mt-4 text-2xl font-semibold">{t("notFound.title")}</h2>
      <p className="mt-4 max-w-md text-muted-foreground">
        {t("notFound.description")}
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("notFound.backToHome")}
      </Link>
    </div>
  );
}
