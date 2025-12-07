import type {
  CampusCourseDetail,
  CampusTenant,
} from "@/services/campus/service";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "learnpress.lat";
const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app"];

type TenantInfo = {
  slug: string | null;
  isCampus: boolean;
  isCustomDomain: boolean;
};

function getTenantFromHostname(hostname: string): TenantInfo {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return { slug: null, isCampus: false, isCustomDomain: false };
  }

  const isOurDomain =
    hostname === BASE_DOMAIN || hostname.endsWith(`.${BASE_DOMAIN}`);

  if (isOurDomain) {
    const parts = hostname.split(".");
    if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
      return { slug: parts[0], isCampus: true, isCustomDomain: false };
    }
    return { slug: null, isCampus: false, isCustomDomain: false };
  }

  return { slug: null, isCampus: true, isCustomDomain: true };
}

async function fetchTenantBySlug(slug: string): Promise<CampusTenant | null> {
  const res = await fetch(`${API_URL}/campus/tenant`, {
    headers: { "X-Tenant-Slug": slug },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tenant;
}

async function fetchTenantByHostname(
  hostname: string
): Promise<CampusTenant | null> {
  const res = await fetch(
    `${API_URL}/campus/resolve?hostname=${encodeURIComponent(hostname)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.tenant;
}

async function fetchCourseBySlug(
  courseSlug: string,
  tenantSlug: string
): Promise<CampusCourseDetail | null> {
  const res = await fetch(`${API_URL}/campus/courses/${courseSlug}`, {
    headers: { "X-Tenant-Slug": tenantSlug },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.course;
}

export type ServerTenantData = {
  tenant: CampusTenant | null;
  isCampus: boolean;
};

export const getServerTenantData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerTenantData> => {
    const request = getRequest();
    const hostname = request?.headers.get("host")?.split(":")[0] || "";

    const { slug, isCampus, isCustomDomain } = getTenantFromHostname(hostname);

    if (!isCampus) {
      return { tenant: null, isCampus: false };
    }

    let tenant: CampusTenant | null = null;

    if (isCustomDomain) {
      tenant = await fetchTenantByHostname(hostname);
    } else if (slug) {
      tenant = await fetchTenantBySlug(slug);
    }

    return { tenant, isCampus: true };
  }
);

export const getServerCourseData = createServerFn({ method: "GET" })
  .inputValidator((data: { courseSlug: string; tenantSlug: string }) => data)
  .handler(async ({ data }): Promise<CampusCourseDetail | null> => {
    return fetchCourseBySlug(data.courseSlug, data.tenantSlug);
  });
