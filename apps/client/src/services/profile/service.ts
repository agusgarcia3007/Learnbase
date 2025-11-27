import { http } from "@/lib/http";

type User = {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "instructor" | "student";
  tenantId: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

type UpdateProfileRequest = {
  name?: string;
  avatar?: string | null;
};

export const QUERY_KEYS = {
  PROFILE: ["profile"],
} as const;

export const ProfileService = {
  async get() {
    const { data } = await http.get<{ user: User }>("/profile/");
    return data;
  },

  async update(payload: UpdateProfileRequest) {
    const { data } = await http.put<{ user: User }>("/profile/", payload);
    return data;
  },
} as const;
