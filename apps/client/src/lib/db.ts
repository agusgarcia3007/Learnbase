import { QueryClient } from "@tanstack/react-query";
import { catchAxiosError } from "./utils";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      onError: catchAxiosError,
    },
  },
});
