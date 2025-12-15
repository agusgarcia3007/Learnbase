import { http } from "@/lib/http";
import type { Tenant } from "@/services/tenants/service";

export type User = {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "owner" | "admin" | "student";
  tenantId: string | null;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileResponse = {
  user: User;
  tenant: Tenant | null;
};

export const QUERY_KEYS = {
  PROFILE: ["profile"],
} as const;

export const ProfileService = {
  async get() {
    const { data } = await http.get<ProfileResponse>("/profile/");
    return data;
  },

  async updateName(name: string) {
    const { data } = await http.put<{ user: User }>("/profile/", { name });
    return data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await http.post<{ user: User }>("/profile/avatar", formData);
    return data;
  },

  async deleteAvatar() {
    const { data } = await http.delete<{ user: User }>("/profile/avatar");
    return data;
  },
} as const;
