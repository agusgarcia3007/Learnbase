import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { DocumentListParams } from "./service";
import { documentsListOptions, documentsInfiniteOptions, documentOptions } from "./options";

export const useDocumentsList = (params?: DocumentListParams) =>
  useQuery(documentsListOptions(params));

export const useDocumentsInfinite = (params?: Omit<DocumentListParams, "page">) =>
  useInfiniteQuery(documentsInfiniteOptions(params));

export const useDocument = (id: string) => useQuery(documentOptions(id));
