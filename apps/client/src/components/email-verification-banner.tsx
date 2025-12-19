import { Alert, AlertIcon, AlertTitle, AlertToolbar } from "@learnbase/ui";
import { Button } from "@learnbase/ui";
import { useResendVerification } from "@/services/auth/mutations";
import { Mail, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const DISMISS_KEY = "email-verification-banner-dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  if (Date.now() - dismissedAt > DISMISS_DURATION) {
    localStorage.removeItem(DISMISS_KEY);
    return false;
  }
  return true;
}

function dismissBanner(): void {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

type EmailVerificationBannerProps = {
  userRole: string;
  emailVerified: boolean;
};

export function EmailVerificationBanner({
  userRole,
  emailVerified,
}: EmailVerificationBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(isDismissed);
  const { mutate: resendVerification, isPending } = useResendVerification();

  if (emailVerified || userRole !== "owner" || dismissed) {
    return null;
  }

  const handleResend = () => {
    resendVerification(undefined, {
      onSuccess: () => {
        toast.success(t("auth.emailVerification.resendSuccess"));
      },
    });
  };

  const handleDismiss = () => {
    dismissBanner();
    setDismissed(true);
  };

  return (
    <Alert variant="warning" appearance="light" size="sm" className="rounded-none border-x-0 border-t-0">
      <AlertIcon>
        <Mail className="size-4" />
      </AlertIcon>
      <AlertTitle className="flex items-center gap-2 text-sm">
        <span>{t("auth.emailVerification.bannerTitle")}</span>
        <span className="hidden text-muted-foreground sm:inline">
          {t("auth.emailVerification.bannerDescription")}
        </span>
      </AlertTitle>
      <AlertToolbar className="flex items-center gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={handleResend}
          isLoading={isPending}
        >
          {t("auth.emailVerification.resend")}
        </Button>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </AlertToolbar>
    </Alert>
  );
}
