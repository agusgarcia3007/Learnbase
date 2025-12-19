import { useMutation } from "@tanstack/react-query";
import {
  useSubmitFeatureOptions,
  useCreateFeatureDirectOptions,
  useUpdateFeatureOptions,
  useUpdateFeatureStatusOptions,
  useApproveFeatureOptions,
  useRejectFeatureOptions,
  useDeleteFeatureOptions,
  useVoteFeatureOptions,
  useRemoveVoteOptions,
} from "./options";

export const useSubmitFeature = () => useMutation(useSubmitFeatureOptions());

export const useCreateFeatureDirect = () =>
  useMutation(useCreateFeatureDirectOptions());

export const useUpdateFeature = () => useMutation(useUpdateFeatureOptions());

export const useUpdateFeatureStatus = () =>
  useMutation(useUpdateFeatureStatusOptions());

export const useApproveFeature = () => useMutation(useApproveFeatureOptions());

export const useRejectFeature = () => useMutation(useRejectFeatureOptions());

export const useDeleteFeature = () => useMutation(useDeleteFeatureOptions());

export const useVoteFeature = () => useMutation(useVoteFeatureOptions());

export const useRemoveVote = () => useMutation(useRemoveVoteOptions());
