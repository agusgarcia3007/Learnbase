import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutMutationOptions } from "./options";
import { QUERY_KEYS as CART_QUERY_KEYS } from "@/services/cart/service";

export function useCreateCheckoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    ...checkoutMutationOptions.createSession(),
    onSuccess: (data) => {
      if (data.type === "free") {
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.CART });
      }
    },
  });
}
