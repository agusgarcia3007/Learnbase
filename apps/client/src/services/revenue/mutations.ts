import { useMutation } from "@tanstack/react-query";
import { revenueMutationOptions } from "./options";

export function useExportPayments() {
  return useMutation(revenueMutationOptions.exportPayments());
}
