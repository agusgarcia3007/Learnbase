import { useMutation } from "@tanstack/react-query";
import {
  generateVideoTitleOptions,
  generateVideoDescriptionOptions,
} from "./options";

export const useGenerateVideoTitle = () =>
  useMutation(generateVideoTitleOptions());

export const useGenerateVideoDescription = () =>
  useMutation(generateVideoDescriptionOptions());
