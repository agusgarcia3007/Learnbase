import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { CartService, QUERY_KEYS } from "./service";

export const cartOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.CART,
    queryFn: () => CartService.getCart(),
  });

export const guestCartOptions = (courseIds: string[]) =>
  queryOptions({
    queryKey: [...QUERY_KEYS.CART, "guest", courseIds],
    queryFn: () => CartService.getGuestCart(courseIds),
    enabled: courseIds.length > 0,
  });

export const addToCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success(i18n.t("cart.addSuccess"));
    },
  });
};

export const removeFromCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success(i18n.t("cart.removeSuccess"));
    },
  });
};

export const clearCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success(i18n.t("cart.clearSuccess"));
    },
  });
};

export const mergeCartOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CartService.mergeCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART });
    },
  });
};
