import { useMutation } from "@tanstack/react-query";
import {
  useCreateDocumentOptions,
  useUpdateDocumentOptions,
  useDeleteDocumentOptions,
  useUploadDocumentFileOptions,
  useDeleteDocumentFileOptions,
  useUploadDocumentStandaloneOptions,
} from "./options";

export const useCreateDocument = () => useMutation(useCreateDocumentOptions());

export const useUpdateDocument = () => useMutation(useUpdateDocumentOptions());

export const useDeleteDocument = () => useMutation(useDeleteDocumentOptions());

export const useUploadDocumentFile = () => useMutation(useUploadDocumentFileOptions());

export const useDeleteDocumentFile = () => useMutation(useDeleteDocumentFileOptions());

export const useUploadDocumentStandalone = () => useMutation(useUploadDocumentStandaloneOptions());
