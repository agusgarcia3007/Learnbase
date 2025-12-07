import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { useUploadMutation } from "@/lib/upload-mutation";
import { isClient } from "@/lib/utils";
import { ProfileService, QUERY_KEYS } from "./service";

export const profileOptions = () =>
  queryOptions({
    queryFn: ProfileService.get,
    queryKey: QUERY_KEYS.PROFILE,
    enabled: isClient() && !!localStorage.getItem("accessToken"),
    retry: false,
  });

export const updateProfileOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ProfileService.updateName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
      toast.success(i18n.t("profile.updateSuccess"));
    },
  });
};

export const uploadAvatarOptions = () =>
  useUploadMutation({
    mutationFn: ProfileService.uploadAvatar,
    invalidateKeys: () => [QUERY_KEYS.PROFILE],
    successMessage: "profile.avatarUploaded",
  });

export const deleteAvatarOptions = () =>
  useUploadMutation({
    mutationFn: ProfileService.deleteAvatar,
    invalidateKeys: () => [QUERY_KEYS.PROFILE],
    successMessage: "profile.avatarDeleted",
  });
