import { useQuery } from "@tanstack/react-query";
import type { DocumentListParams } from "./service";
import { documentsListOptions, documentOptions } from "./options";

export const useDocumentsList = (params?: DocumentListParams) =>
  useQuery(documentsListOptions(params));

export const useDocument = (id: string) => useQuery(documentOptions(id));
