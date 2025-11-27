import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { ProfileService, QUERY_KEYS } from "./service";

export const profileOptions = queryOptions({
  queryFn: ProfileService.get,
  queryKey: QUERY_KEYS.PROFILE,
});

export const updateProfileOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ProfileService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
    },
  });
};
