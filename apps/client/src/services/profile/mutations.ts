import { useMutation } from "@tanstack/react-query";
import { updateProfileOptions } from "./options";

export const useUpdateProfile = () => useMutation(updateProfileOptions());
