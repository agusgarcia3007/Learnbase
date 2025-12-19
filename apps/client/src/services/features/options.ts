import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import {
  FeaturesService,
  QUERY_KEYS,
  type SubmitFeatureRequest,
  type CreateFeatureDirectRequest,
  type UpdateFeatureRequest,
  type UpdateFeatureStatusRequest,
  type FeatureBoardResponse,
  type Feature,
} from "./service";

export const featuresBoardOptions = () =>
  queryOptions({
    queryFn: () => FeaturesService.getBoard(),
    queryKey: QUERY_KEYS.FEATURES_BOARD,
  });

export const featuresPendingOptions = () =>
  queryOptions({
    queryFn: () => FeaturesService.getPending(),
    queryKey: QUERY_KEYS.FEATURES_PENDING,
  });

export const featureOptions = (id: string) =>
  queryOptions({
    queryFn: () => FeaturesService.getById(id),
    queryKey: QUERY_KEYS.FEATURE(id),
    enabled: !!id,
  });

export const useSubmitFeatureOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: SubmitFeatureRequest) => FeaturesService.submit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      toast.success(i18n.t("features.submit.success"));
    },
  });
};

export const useCreateFeatureDirectOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateFeatureDirectRequest) => FeaturesService.createDirect(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      toast.success(i18n.t("features.create.success"));
    },
  });
};

export const useUpdateFeatureOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateFeatureRequest) =>
      FeaturesService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURE(id) });
      toast.success(i18n.t("features.update.success"));
    },
  });
};

export const useUpdateFeatureStatusOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateFeatureStatusRequest) =>
      FeaturesService.updateStatus(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURE(id) });
    },
  });
};

export const useApproveFeatureOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (id: string) => FeaturesService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      toast.success(i18n.t("features.approve.success"));
    },
  });
};

export const useRejectFeatureOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      FeaturesService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      toast.success(i18n.t("features.reject.success"));
    },
  });
};

export const useDeleteFeatureOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: FeaturesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES });
      toast.success(i18n.t("features.delete.success"));
    },
  });
};

export const useVoteFeatureOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, value }: { id: string; value: 1 | -1 }) =>
      FeaturesService.vote(id, value),
    onMutate: async ({ id, value }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FEATURES_BOARD });
      const previous = queryClient.getQueryData<FeatureBoardResponse>(QUERY_KEYS.FEATURES_BOARD);

      if (previous) {
        const updateFeature = (feature: Feature): Feature => {
          if (feature.id !== id) return feature;
          const currentVote = feature.userVote;
          let newVoteCount = feature.voteCount;
          let newUserVote: 1 | -1 | null = value;

          if (currentVote === value) {
            newVoteCount -= value;
            newUserVote = null;
          } else if (currentVote !== null) {
            newVoteCount += value * 2;
          } else {
            newVoteCount += value;
          }

          return { ...feature, voteCount: newVoteCount, userVote: newUserVote };
        };

        queryClient.setQueryData<FeatureBoardResponse>(QUERY_KEYS.FEATURES_BOARD, {
          features: {
            ideas: previous.features.ideas.map(updateFeature),
            inProgress: previous.features.inProgress.map(updateFeature),
            shipped: previous.features.shipped.map(updateFeature),
          },
        });
      }

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.FEATURES_BOARD, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES_BOARD });
    },
  });
};

export const useRemoveVoteOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (id: string) => FeaturesService.removeVote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURES_BOARD });
    },
  });
};
