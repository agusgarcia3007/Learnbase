import { useMutation } from "@tanstack/react-query";
import {
  deleteAvatarOptions,
  updateProfileOptions,
  uploadAvatarOptions,
} from "./options";

export const useUpdateProfile = () => useMutation(updateProfileOptions());
export const useUploadAvatar = () => useMutation(uploadAvatarOptions());
export const useDeleteAvatar = () => useMutation(deleteAvatarOptions());
