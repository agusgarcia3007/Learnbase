import { useMutation } from "@tanstack/react-query";
import {
  useLoginOptions,
  useSignupOptions,
  refreshOptions,
  forgotPasswordOptions,
  resetPasswordOptions,
  useLogoutOptions,
  verifyEmailOptions,
  useResendVerificationOptions,
} from "./options";

export const useLogin = () => useMutation(useLoginOptions());

export const useSignup = () => useMutation(useSignupOptions());

export const useRefresh = () => useMutation(refreshOptions());

export const useLogout = () => useMutation(useLogoutOptions());

export const useForgotPassword = () => useMutation(forgotPasswordOptions());

export const useResetPassword = () => useMutation(resetPasswordOptions());

export const useVerifyEmail = () => useMutation(verifyEmailOptions());

export const useResendVerification = () =>
  useMutation(useResendVerificationOptions());
