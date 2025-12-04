import { env } from "./env";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

type CloudflareResponse<T> = {
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
  result: T;
};

export type CustomHostnameStatus =
  | "pending"
  | "pending_validation"
  | "pending_issuance"
  | "pending_deployment"
  | "active"
  | "pending_deletion"
  | "moved"
  | "deleted";

export type CustomHostnameSSLStatus =
  | "initializing"
  | "pending_validation"
  | "pending_issuance"
  | "pending_deployment"
  | "active"
  | "pending_expiration"
  | "expired"
  | "deleted"
  | "validation_timed_out"
  | "issuance_timed_out";

export type CustomHostname = {
  id: string;
  hostname: string;
  status: CustomHostnameStatus;
  ssl: {
    id: string;
    status: CustomHostnameSSLStatus;
    method: string;
    type: string;
    validation_records?: {
      txt_name: string;
      txt_value: string;
    }[];
    validation_errors?: { message: string }[];
  };
  created_at: string;
  custom_origin_server?: string;
};

async function cloudflareRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as CloudflareResponse<T>;

  if (!data.success) {
    const errorMessage = data.errors.map((e) => e.message).join(", ");
    throw new Error(`Cloudflare API error: ${errorMessage}`);
  }

  return data.result;
}

export async function createCustomHostname(
  hostname: string
): Promise<CustomHostname> {
  return cloudflareRequest<CustomHostname>(
    `/zones/${env.CLOUDFLARE_ZONE_ID}/custom_hostnames`,
    {
      method: "POST",
      body: JSON.stringify({
        hostname,
        ssl: {
          method: "http",
          type: "dv",
          bundle_method: "ubiquitous",
        },
      }),
    }
  );
}

export async function getCustomHostname(
  hostname: string
): Promise<CustomHostname | null> {
  const results = await cloudflareRequest<CustomHostname[]>(
    `/zones/${env.CLOUDFLARE_ZONE_ID}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`
  );
  return results[0] || null;
}

export async function getCustomHostnameById(
  hostnameId: string
): Promise<CustomHostname> {
  return cloudflareRequest<CustomHostname>(
    `/zones/${env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`
  );
}

export async function deleteCustomHostname(hostnameId: string): Promise<void> {
  await cloudflareRequest<{ id: string }>(
    `/zones/${env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`,
    { method: "DELETE" }
  );
}

export function getCnameTarget(): string {
  return env.CLOUDFLARE_CNAME_TARGET;
}
