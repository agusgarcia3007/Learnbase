import { http } from "@/lib/http";

export type User = {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "instructor" | "student";
  tenantId: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

export const QUERY_KEYS = {
  PROFILE: ["profile"],
} as const;

export const ProfileService = {
  async get() {
    const { data } = await http.get<{ user: User }>("/profile/");
    return data;
  },

  async updateName(name: string) {
    const { data } = await http.put<{ user: User }>("/profile/", { name });
    return data;
  },

  async uploadAvatar(base64: string) {
    const { data } = await http.post<{ user: User }>("/profile/avatar", { avatar: base64 });
    return data;
  },

  async deleteAvatar() {
    const { data } = await http.delete<{ user: User }>("/profile/avatar");
    return data;
  },
} as const;
