import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DomainTabProps = {
  tenantSlug: string | undefined;
  customDomain: string;
  onCustomDomainChange: (value: string) => void;
  baseDomain: string;
  isVerified: boolean | undefined;
  onSaveDomain: () => void;
  onRemoveDomain: () => void;
  isSavingDomain: boolean;
  isRemovingDomain: boolean;
};

export function DomainTab({
  tenantSlug,
  customDomain,
  onCustomDomainChange,
  baseDomain,
  isVerified,
  onSaveDomain,
  onRemoveDomain,
  isSavingDomain,
  isRemovingDomain,
}: DomainTabProps) {
  const { t } = useTranslation();
  const [domainCopied, setDomainCopied] = useState(false);

  const extractSubdomain = (domain: string) => {
    const parts = domain.split(".");
    return parts.length > 2 ? parts.slice(0, -2).join(".") : "@";
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(
      baseDomain || import.meta.env.VITE_BASE_DOMAIN || ""
    );
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2000);
  };

  const displayDomain = baseDomain || import.meta.env.VITE_BASE_DOMAIN || "yourdomain.com";

  return (
    <TabsContent value="domain" className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">
          {t("dashboard.site.configuration.domain.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.site.configuration.domain.description")}
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <label className="text-sm font-medium">
            {t("dashboard.site.configuration.domain.currentUrl")}
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenantSlug}.{displayDomain}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("dashboard.site.configuration.domain.customDomain")}
          </label>
          <div className="flex gap-2">
            <Input
              value={customDomain}
              onChange={(e) => onCustomDomainChange(e.target.value)}
              placeholder={t(
                "dashboard.site.configuration.domain.placeholder"
              )}
              className="max-w-md"
            />
            <Button
              type="button"
              onClick={onSaveDomain}
              disabled={isSavingDomain}
            >
              {isSavingDomain ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        </div>
      </div>

      {customDomain && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {t("dashboard.site.configuration.domain.instructions")}
            </h4>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <span className="size-1.5 rounded-full bg-green-500" />
                {t("dashboard.site.configuration.domain.verified")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                <span className="size-1.5 animate-pulse rounded-full bg-yellow-500" />
                {t("dashboard.site.configuration.domain.notVerified")}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {t("dashboard.site.configuration.domain.configureInProvider")}
          </p>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("dashboard.site.configuration.domain.dnsTable.type")}
                  </TableHead>
                  <TableHead>
                    {t("dashboard.site.configuration.domain.dnsTable.host")}
                  </TableHead>
                  <TableHead>
                    {t("dashboard.site.configuration.domain.dnsTable.value")}
                  </TableHead>
                  <TableHead>
                    {t("dashboard.site.configuration.domain.dnsTable.ttl")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>CNAME</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {extractSubdomain(customDomain)}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            extractSubdomain(customDomain)
                          );
                        }}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {displayDomain}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0"
                        onClick={handleCopyDomain}
                      >
                        {domainCopied ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>Auto</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("dashboard.site.configuration.domain.hostNote")}
          </p>

          <p className="text-xs text-muted-foreground">
            {t("dashboard.site.configuration.domain.propagationNote")}
          </p>

          <Button
            type="button"
            variant="destructive"
            onClick={onRemoveDomain}
            disabled={isRemovingDomain}
          >
            {isRemovingDomain ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {t("dashboard.site.configuration.domain.remove")}
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
