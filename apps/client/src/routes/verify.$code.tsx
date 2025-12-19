import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Award, CheckCircle, XCircle, Download, ArrowLeft } from "lucide-react";
import { Button } from "@learnbase/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useCertificateVerify } from "@/services/certificates";
import { getCertificateVerifyServer } from "@/services/certificates/server";
import type { CertificateVerification } from "@/services/certificates/service";

const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "uselearnbase.com";

function buildVerificationUrl(
  code: string,
  tenantSlug: string,
  customDomain: string | null
): string {
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : `https://${tenantSlug}.${BASE_DOMAIN}`;
  return `${baseUrl}/verify/${code}`;
}

export const Route = createFileRoute("/verify/$code")({
  loader: async ({ params }): Promise<CertificateVerification> => {
    return getCertificateVerifyServer({ data: { code: params.code } });
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.valid || !loaderData.certificate) {
      return {
        meta: [
          { title: "Certificate Verification" },
          {
            name: "description",
            content: "Verify the authenticity of a course completion certificate",
          },
        ],
      };
    }

    const { certificate } = loaderData;
    const tenantName = certificate.tenant.name;
    const title = `${certificate.userName} - Certificate of Completion | ${tenantName}`;
    const description = `Verified certificate for completing ${certificate.courseName}`;
    const verificationUrl = buildVerificationUrl(
      params.code,
      certificate.tenant.slug,
      certificate.tenant.customDomain
    );

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: certificate.imageUrl || "" },
        { property: "og:url", content: verificationUrl },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: tenantName },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: certificate.imageUrl || "" },
      ],
      links: [{ rel: "canonical", href: verificationUrl }],
    };
  },
  component: VerifyCertificatePage,
});

function VerifyCertificatePage() {
  const { t } = useTranslation();
  const { code } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const { data, isLoading } = useCertificateVerify(code);

  const certificateData = data ?? loaderData;

  if (isLoading && !loaderData) {
    return <VerifyPageSkeleton />;
  }

  if (!certificateData?.valid || !certificateData.certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-10 text-destructive" />
          </div>

          <h1 className="mb-3 text-2xl font-bold">
            {t("certificates.verification.invalid")}
          </h1>

          <p className="mb-8 text-muted-foreground">
            {t("certificates.verification.invalidDescription")}
          </p>

          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" />
              {t("common.backToHome")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { certificate } = certificateData;
  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const handleDownload = () => {
    if (certificate.imageUrl) {
      const link = document.createElement("a");
      link.href = certificate.imageUrl;
      link.download = `certificate-${certificate.courseName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="size-4" />
            {t("certificates.verification.valid")}
          </div>

          <h1 className="mb-2 text-3xl font-bold">
            {t("certificates.verification.title")}
          </h1>

          <p className="text-muted-foreground">
            {t("certificates.verification.verificationCode")}: {code}
          </p>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-lg">
          {certificate.tenant.logo && (
            <div className="flex justify-center border-b bg-muted/30 p-6">
              <img
                src={certificate.tenant.logo}
                alt={certificate.tenant.name}
                className="h-12 object-contain"
              />
            </div>
          )}

          <div className="p-8">
            <div className="mb-8 flex items-center justify-center gap-3">
              <Award className="size-8 text-primary" />
              <h2 className="text-2xl font-bold">{t("certificates.title")}</h2>
            </div>

            <div className="mb-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  {t("certificates.verification.issuedTo")}
                </p>
                <p className="text-lg font-semibold">{certificate.userName}</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  {t("certificates.verification.course")}
                </p>
                <p className="text-lg font-semibold">{certificate.courseName}</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  {t("certificates.verification.issuedOn")}
                </p>
                <p className="text-lg font-semibold">{formattedDate}</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  {t("certificates.verification.issuedBy")}
                </p>
                <p className="text-lg font-semibold">{certificate.tenant.name}</p>
              </div>
            </div>

            {certificate.imageUrl && (
              <div className="mb-6 overflow-hidden rounded-xl border">
                <img
                  src={certificate.imageUrl}
                  alt={t("certificates.title")}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex justify-center">
              <Button onClick={handleDownload} disabled={!certificate.imageUrl}>
                <Download className="mr-2 size-4" />
                {t("certificates.downloadCertificate")}
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" />
              {t("common.backToHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function VerifyPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex flex-col items-center">
          <Skeleton className="mb-4 h-8 w-32 rounded-full" />
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <Skeleton className="h-24 w-full" />
          <div className="p-8">
            <div className="mb-8 flex justify-center">
              <Skeleton className="h-10 w-64" />
            </div>
            <div className="mb-8 grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="aspect-[16/11] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
