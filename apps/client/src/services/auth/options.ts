import { setTokens } from "@/lib/http";
import { QUERY_KEYS } from "@/services/profile/service";
import { mutationOptions, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "./service";

export const loginOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
    },
  });
};

export const signupOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: AuthService.signup,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
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
