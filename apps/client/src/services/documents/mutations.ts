import { useMutation } from "@tanstack/react-query";
import {
  createDocumentOptions,
  updateDocumentOptions,
  deleteDocumentOptions,
  uploadDocumentFileOptions,
  deleteDocumentFileOptions,
  uploadDocumentStandaloneOptions,
} from "./options";

export const useCreateDocument = () => useMutation(createDocumentOptions());

export const useUpdateDocument = () => useMutation(updateDocumentOptions());

export const useDeleteDocument = () => useMutation(deleteDocumentOptions());

export const useUploadDocumentFile = () => useMutation(uploadDocumentFileOptions());

export const useDeleteDocumentFile = () => useMutation(deleteDocumentFileOptions());

export const useUploadDocumentStandalone = () => useMutation(uploadDocumentStandaloneOptions());
