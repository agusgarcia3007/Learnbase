import { useQuery } from "@tanstack/react-query";
import { cartOptions } from "./options";

export const useGetCart = (options?: { enabled?: boolean }) =>
  useQuery({ ...cartOptions(), ...options });
