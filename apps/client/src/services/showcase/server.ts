import { createServerFn } from "@tanstack/react-start";
import type { ShowcaseTenant } from "@/components/landing/tenant-card";

const API_URL = import.meta.env.VITE_API_URL;

type ShowcaseTenantsResponse = { tenants: ShowcaseTenant[] };

export const getShowcaseTenantsServer = createServerFn({ method: "GET" })
  .inputValidator((d: Record<string, never>) => d)
  .handler(async (): Promise<ShowcaseTenantsResponse | null> => {
    const response = await fetch(`${API_URL}/showcase/tenants`);
    if (!response.ok) return null;
    return response.json();
  });
