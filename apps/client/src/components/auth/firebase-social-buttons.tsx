import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Google } from "@/components/ui/svgs/google";
import { Apple } from "@/components/ui/svgs/apple";
import {
  getFirebaseAuth,
  signInWithGoogle,
  signInWithApple,
  type FirebaseConfig,
} from "@/lib/firebase";
import { useExternalLogin } from "@/services/auth/mutations";

interface FirebaseSocialButtonsProps {
  tenantSlug: string;
  firebaseConfig: FirebaseConfig;
  onSuccess: () => void;
}

export function FirebaseSocialButtons({
  tenantSlug,
  firebaseConfig,
  onSuccess,
}: FirebaseSocialButtonsProps) {
  const { t } = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { mutate: externalLogin } = useExternalLogin();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const auth = getFirebaseAuth(tenantSlug, firebaseConfig);
      const idToken = await signInWithGoogle(auth);
      externalLogin(idToken, { onSuccess });
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const auth = getFirebaseAuth(tenantSlug, firebaseConfig);
      const idToken = await signInWithApple(auth);
      externalLogin(idToken, { onSuccess });
    } catch {
      setIsAppleLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isAppleLoading}
        isLoading={isGoogleLoading}
      >
        {!isGoogleLoading && <Google className="mr-2 size-5" />}
        {t("auth.social.continueWithGoogle")}
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAppleSignIn}
        disabled={isGoogleLoading}
        isLoading={isAppleLoading}
      >
        {!isAppleLoading && <Apple className="mr-2 size-5 fill-current" />}
        {t("auth.social.continueWithApple")}
      </Button>
    </div>
  );
}
