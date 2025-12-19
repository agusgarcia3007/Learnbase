import { useTranslation } from "react-i18next";
import { Button } from "@learnbase/ui";

type SaveButtonProps = {
  isLoading: boolean;
};

export function SaveButton({ isLoading }: SaveButtonProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end border-t pt-6">
      <Button type="submit" isLoading={isLoading}>
        {t("common.save")}
      </Button>
    </div>
  );
}
