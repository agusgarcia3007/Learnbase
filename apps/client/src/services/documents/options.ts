import {
  mutationOptions,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { i18n } from "@/i18n";
import { useUploadMutation } from "@/lib/upload-mutation";
import {
  DocumentsService,
  QUERY_KEYS,
  type DocumentListParams,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
} from "./service";

export const documentsListOptions = (params?: DocumentListParams) =>
  queryOptions({
    queryFn: () => DocumentsService.list(params),
    queryKey: QUERY_KEYS.DOCUMENTS_LIST(params),
  });

export const documentOptions = (id: string) =>
  queryOptions({
    queryFn: () => DocumentsService.getById(id),
    queryKey: QUERY_KEYS.DOCUMENT(id),
    enabled: !!id,
  });

export const useCreateDocumentOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (payload: CreateDocumentRequest) => DocumentsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS });
      toast.success(i18n.t("documents.createSuccess"));
    },
  });
};

export const useUpdateDocumentOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateDocumentRequest) =>
      DocumentsService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENT(id) });
      toast.success(i18n.t("documents.updateSuccess"));
    },
  });
};

export const useDeleteDocumentOptions = () => {
  const queryClient = useQueryClient();
  return mutationOptions({
    mutationFn: (id: string) => DocumentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS });
      toast.success(i18n.t("documents.deleteSuccess"));
    },
  });
};

export const useUploadDocumentFileOptions = () =>
  useUploadMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      DocumentsService.uploadFile(id, file),
    invalidateKeys: (payload) => [QUERY_KEYS.DOCUMENTS, QUERY_KEYS.DOCUMENT(payload.id)],
    successMessage: "documents.uploadSuccess",
  });

export const useDeleteDocumentFileOptions = () =>
  useUploadMutation({
    mutationFn: DocumentsService.deleteFile,
    invalidateKeys: (id) => [QUERY_KEYS.DOCUMENTS, QUERY_KEYS.DOCUMENT(id)],
    successMessage: "documents.fileDeleted",
  });

export const useUploadDocumentStandaloneOptions = () =>
  useUploadMutation({
    mutationFn: (file: File) => DocumentsService.upload(file),
    invalidateKeys: () => [],
  });
