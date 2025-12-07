import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { i18n } from "@/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isClient = () => typeof window !== "undefined";

export function catchAxiosError(error: unknown) {
  const defaultMessage = i18n.t("common.unexpected_error");

  if (error instanceof AxiosError) {
    const errorCode = error.response?.data?.code;

    // If there's an error code, try to translate it (normalize to lowercase for i18n)
    const message =
      errorCode && i18n.exists(`errors.${errorCode.toLowerCase()}`)
        ? i18n.t(`errors.${errorCode.toLowerCase()}`)
        : error.response?.data?.message ||
          error.response?.data?.error ||
          defaultMessage;

    toast.error(message);
    return;
  }

  toast.error(defaultMessage);
}
