import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { ProfileService, QUERY_KEYS } from "./service";

export const profileOptions = () =>
  queryOptions({
    queryFn: ProfileService.get,
    queryKey: QUERY_KEYS.PROFILE,
    enabled: !!localStorage.getItem("accessToken"),
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

export const uploadAvatarOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ProfileService.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
      toast.success(i18n.t("profile.avatarUploaded"));
    },
  });
};

export const deleteAvatarOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ProfileService.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
      toast.success(i18n.t("profile.avatarDeleted"));
    },
  });
};
