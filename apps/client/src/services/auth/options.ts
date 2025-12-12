import { setTokens } from "@/lib/http";
import { QUERY_KEYS } from "@/services/profile/service";
import { QUERY_KEYS as CART_QUERY_KEYS } from "@/services/cart/service";
import { mutationOptions, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "./service";

export const useLoginOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.PROFILE });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.CART });
    },
  });
};

export const useSignupOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.signup,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.PROFILE });
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

export const useLogoutOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const verifyEmailOptions = () =>
  mutationOptions({
    mutationFn: AuthService.verifyEmail,
  });

export const useResendVerificationOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.resendVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
    },
  });
};
