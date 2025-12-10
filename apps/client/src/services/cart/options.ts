import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { CartService, QUERY_KEYS } from "./service";
import { QUERY_KEYS as ENROLLMENT_QUERY_KEYS } from "@/services/enrollments/service";

export const cartOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.CART,
    queryFn: () => CartService.getCart(),
  });

export const useAddToCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success(i18n.t("cart.addSuccess"));
    },
  });
};

export const useRemoveFromCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success(i18n.t("cart.removeSuccess"));
    },
  });
};

export const useClearCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success(i18n.t("cart.clearSuccess"));
    },
  });
};

export const useCheckoutOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      queryClient.invalidateQueries({ queryKey: ENROLLMENT_QUERY_KEYS.ENROLLMENTS });
      toast.success(i18n.t("cart.checkoutSuccess"));
    },
  });
};
