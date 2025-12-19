import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@learnbase/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCertificatePreview } from "@/services/certificates";

type CertificatePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];

export function CertificatePreviewModal({
  isOpen,
  onClose,
}: CertificatePreviewModalProps) {
  const { t, i18n } = useTranslation();
  const [locale, setLocale] = useState(i18n.language.split("-")[0] || "en");
  const { mutate: generatePreview, data, isPending, reset } = useCertificatePreview();

  useEffect(() => {
    if (isOpen) {
      generatePreview(locale);
    } else {
      reset();
    }
  }, [isOpen, locale, generatePreview, reset]);

  const handleDownload = () => {
    if (!data?.imageUrl) return;

    const link = document.createElement("a");
    link.href = data.imageUrl;
    link.download = `certificate-preview-${locale}.png`;
    link.click();
  };

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("certificates.preview.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={locale} onValueChange={handleLocaleChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!data?.imageUrl || isPending}
            >
              <Download className="mr-2 size-4" />
              {t("certificates.preview.download")}
            </Button>
          </div>

          <div className="relative min-h-[400px] overflow-hidden rounded-lg border bg-muted">
            {isPending ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={t("certificates.preview.title")}
                className="w-full"
              />
            ) : null}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {t("certificates.preview.description")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
