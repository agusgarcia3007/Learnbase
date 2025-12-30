import { useMutation } from "@tanstack/react-query";
import {
  useLoginOptions,
  useSignupOptions,
  refreshOptions,
  forgotPasswordOptions,
  useResetPasswordOptions,
  useLogoutOptions,
  verifyEmailOptions,
  useResendVerificationOptions,
  useExternalLoginOptions,
} from "./options";

export const useLogin = () => useMutation(useLoginOptions());

export const useSignup = () => useMutation(useSignupOptions());

export const useRefresh = () => useMutation(refreshOptions());

export const useLogout = () => useMutation(useLogoutOptions());

export const useForgotPassword = () => useMutation(forgotPasswordOptions());

export const useResetPassword = () => useMutation(useResetPasswordOptions());

export const useVerifyEmail = () => useMutation(verifyEmailOptions());

export const useResendVerification = () =>
  useMutation(useResendVerificationOptions());

export const useExternalLogin = () => useMutation(useExternalLoginOptions());
