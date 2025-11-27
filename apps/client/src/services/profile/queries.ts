import { useQuery } from "@tanstack/react-query";
import { profileOptions } from "./options";

export const useGetProfile = () => useQuery(profileOptions());
