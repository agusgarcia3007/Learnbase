import { setTokens } from "@/lib/http";
import { QUERY_KEYS } from "@/services/profile/service";
import { QUERY_KEYS as CART_QUERY_KEYS, CartService } from "@/services/cart/service";
import { getGuestCartCourseIds, clearGuestCartStorage } from "@/hooks/use-guest-cart";
import { mutationOptions, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "./service";

const mergeGuestCart = async () => {
  const courseIds = getGuestCartCourseIds();
  if (courseIds.length > 0) {
    await CartService.mergeCart(courseIds);
    clearGuestCartStorage();
  }
};

export const loginOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.login,
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken);
      await mergeGuestCart();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.CART });
    },
  });
};

export const signupOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.signup,
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken);
      await mergeGuestCart();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.CART });
    },
  });
};

export const refreshOptions = () =>
  mutationOptions({
    mutationFn: AuthService.refresh,
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
    },
  });

export const forgotPasswordOptions = () =>
  mutationOptions({
    mutationFn: AuthService.forgotPassword,
  });

export const resetPasswordOptions = () =>
  mutationOptions({
    mutationFn: AuthService.resetPassword,
  });

export const logoutOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
