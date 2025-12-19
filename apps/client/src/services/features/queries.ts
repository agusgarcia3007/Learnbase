import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  featuresBoardOptions,
  featuresPendingOptions,
  featureOptions,
} from "./options";

export const useFeaturesBoard = () => useQuery(featuresBoardOptions());

export const useFeaturesBoardSuspense = () =>
  useSuspenseQuery(featuresBoardOptions());

export const useFeaturesPending = () => useQuery(featuresPendingOptions());

export const useFeaturesPendingSuspense = () =>
  useSuspenseQuery(featuresPendingOptions());

export const useFeature = (id: string) => useQuery(featureOptions(id));

export const useFeatureSuspense = (id: string) =>
  useSuspenseQuery(featureOptions(id));
