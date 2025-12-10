import { useMutation } from "@tanstack/react-query";
import {
  useDeleteAvatarOptions,
  useUpdateProfileOptions,
  useUploadAvatarOptions,
} from "./options";

export const useUpdateProfile = () => useMutation(useUpdateProfileOptions());
export const useUploadAvatar = () => useMutation(useUploadAvatarOptions());
export const useDeleteAvatar = () => useMutation(useDeleteAvatarOptions());
