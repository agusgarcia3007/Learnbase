import { useTranslation } from "react-i18next";
import { Award, Download, Mail, Link2, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@learnbase/ui";
import { useSendCertificateEmail } from "@/services/certificates";

type CertificateCardProps = {
  certificate: {
    imageUrl: string | null;
    userName: string;
    courseName: string;
    issuedAt: string;
    verificationUrl: string;
    enrollmentId: string;
  };
};

export function CertificateCard({ certificate }: CertificateCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { mutate: sendEmail, isPending: isSendingEmail } =
    useSendCertificateEmail();

  const handleDownload = () => {
    if (certificate.imageUrl) {
      const link = document.createElement("a");
      link.href = certificate.imageUrl;
      link.download = `certificate-${certificate.courseName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.click();
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(certificate.verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    sendEmail(certificate.enrollmentId);
  };

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Award className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{t("certificates.title")}</h3>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {certificate.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-lg border">
          <img
            src={certificate.imageUrl}
            alt={t("certificates.title")}
            className="w-full"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleDownload}
          disabled={!certificate.imageUrl}
        >
          <Download className="mr-2 size-4" />
          {t("certificates.downloadCertificate")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          isLoading={isSendingEmail}
        >
          <Mail className="mr-2 size-4" />
          {t("certificates.emailCertificate")}
        </Button>

        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 size-4" />
              {t("certificates.linkCopied")}
            </>
          ) : (
            <>
              <Link2 className="mr-2 size-4" />
              {t("certificates.copyLink")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
