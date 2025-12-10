import { useMutation } from "@tanstack/react-query";
import { useUpdateUserOptions, useDeleteUserOptions } from "./options";

export const useUpdateUser = () => useMutation(useUpdateUserOptions());

export const useDeleteUser = () => useMutation(useDeleteUserOptions());
