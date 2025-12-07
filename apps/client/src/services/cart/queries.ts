import { useQuery } from "@tanstack/react-query";
import { cartOptions, guestCartOptions } from "./options";

export const useGetCart = (options?: { enabled?: boolean }) =>
  useQuery({ ...cartOptions(), ...options });

export const useGetGuestCart = (courseIds: string[]) =>
  useQuery(guestCartOptions(courseIds));
