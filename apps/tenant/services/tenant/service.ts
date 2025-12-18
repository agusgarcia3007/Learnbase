import { http } from "@/lib/http";

export type TenantSettings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  favicon: string | null;
  domain: string | null;
  supportEmail: string | null;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  } | null;
};

export type TenantCustomization = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
};

export type TenantAISettings = {
  enabled: boolean;
  provider: "openai" | "anthropic" | null;
  model: string | null;
  systemPrompt: string | null;
};

export type UpdateTenantSettingsRequest = Partial<Omit<TenantSettings, "id" | "slug">>;
export type UpdateTenantCustomizationRequest = Partial<TenantCustomization>;
export type UpdateTenantAISettingsRequest = Partial<TenantAISettings>;

export const QUERY_KEYS = {
  TENANT_SETTINGS: ["tenant", "settings"] as const,
  TENANT_CUSTOMIZATION: ["tenant", "customization"] as const,
  TENANT_AI: ["tenant", "ai"] as const,
} as const;

export const TenantService = {
  async getSettings() {
    const { data } = await http.get<{ tenant: TenantSettings }>("/tenant/settings");
    return data;
  },

  async updateSettings(payload: UpdateTenantSettingsRequest) {
    const { data } = await http.put<{ tenant: TenantSettings }>("/tenant/settings", payload);
    return data;
  },

  async getCustomization() {
    const { data } = await http.get<{ customization: TenantCustomization }>("/tenant/customization");
    return data;
  },

  async updateCustomization(payload: UpdateTenantCustomizationRequest) {
    const { data } = await http.put<{ customization: TenantCustomization }>("/tenant/customization", payload);
    return data;
  },

  async getAISettings() {
    const { data } = await http.get<{ ai: TenantAISettings }>("/tenant/ai");
    return data;
  },

  async updateAISettings(payload: UpdateTenantAISettingsRequest) {
    const { data } = await http.put<{ ai: TenantAISettings }>("/tenant/ai", payload);
    return data;
  },
} as const;
