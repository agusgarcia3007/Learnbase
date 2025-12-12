import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { CertificatesService, QUERY_KEYS } from "./service";

export const certificatesListOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.CERTIFICATES,
    queryFn: () => CertificatesService.list(),
  });

export const certificateOptions = (enrollmentId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.CERTIFICATE(enrollmentId),
    queryFn: () => CertificatesService.getByEnrollment(enrollmentId),
    enabled: !!enrollmentId,
  });

export const certificateVerifyOptions = (code: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.VERIFY(code),
    queryFn: () => CertificatesService.verify(code),
    enabled: !!code,
    retry: false,
  });

export const useSendCertificateEmailOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CertificatesService.sendEmail,
    onSuccess: (_data, enrollmentId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CERTIFICATE(enrollmentId),
      });
      toast.success(i18n.t("certificates.emailSent"));
    },
  });
};

export const useCertificatePreviewOptions = () =>
  mutationOptions({
    mutationFn: CertificatesService.preview,
  });

export const useCertificateRegenerateOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CertificatesService.regenerate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CERTIFICATES,
      });
      toast.success(i18n.t("certificates.regenerated"));
    },
  });
};

export const useCertificateRegenerateAllOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: CertificatesService.regenerateAll,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CERTIFICATES,
      });
      toast.success(
        i18n.t("certificates.regeneratedAll", {
          count: data.regenerated,
          total: data.total,
        })
      );
    },
  });
};
