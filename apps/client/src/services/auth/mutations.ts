import { useMutation } from "@tanstack/react-query";
import {
  loginOptions,
  signupOptions,
  refreshOptions,
  forgotPasswordOptions,
  resetPasswordOptions,
  logoutOptions,
} from "./options";

export const useLogin = () => useMutation(loginOptions());

export const useSignup = () => useMutation(signupOptions());

export const useRefresh = () => useMutation(refreshOptions());

export const useLogout = () => useMutation(logoutOptions());

export const useForgotPassword = () => useMutation(forgotPasswordOptions());

export const useResetPassword = () => useMutation(resetPasswordOptions());
