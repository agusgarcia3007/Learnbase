import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@learnbase/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmValue: string;
  onConfirm: () => void;
  isPending?: boolean;
};

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmValue,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setInputValue("");
      setCopied(false);
    }
  }, [open]);

  const isConfirmDisabled = inputValue !== confirmValue || isPending;

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(confirmValue);
    setCopied(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (inputValue === confirmValue) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="confirm-input">
              {confirmLabel ?? t("common.typeToConfirm")}
            </Label>
            <code className="bg-muted rounded px-1.5 py-0.5 text-sm font-mono">
              {confirmValue}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <Input
            id="confirm-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmValue}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            isLoading={isPending}
          >
            {t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
