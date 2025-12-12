import { useMutation } from "@tanstack/react-query";
import {
  useCertificatePreviewOptions,
  useCertificateRegenerateAllOptions,
  useCertificateRegenerateOptions,
  useSendCertificateEmailOptions,
} from "./options";

export const useSendCertificateEmail = () =>
  useMutation(useSendCertificateEmailOptions());

export const useCertificatePreview = () =>
  useMutation(useCertificatePreviewOptions());

export const useCertificateRegenerate = () =>
  useMutation(useCertificateRegenerateOptions());

export const useCertificateRegenerateAll = () =>
  useMutation(useCertificateRegenerateAllOptions());
