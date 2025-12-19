import { useMutation } from "@tanstack/react-query";
import { useMarkAsReadOptions, useMarkAllAsReadOptions } from "./options";

export const useMarkAsRead = () => useMutation(useMarkAsReadOptions());

export const useMarkAllAsRead = () => useMutation(useMarkAllAsReadOptions());
