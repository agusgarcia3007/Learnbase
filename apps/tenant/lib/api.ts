import { cache } from "react";
import type { Tenant, Course } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444";

async function fetchTenantBySlugInternal(
  slug: string
): Promise<Tenant | null> {
  const response = await fetch(`${API_URL}/campus/tenant`, {
    headers: { "X-Tenant-Slug": slug },
    cache: "force-cache",
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.tenant;
}

async function fetchTenantByCustomDomainInternal(
  hostname: string
): Promise<Tenant | null> {
  const response = await fetch(
    `${API_URL}/campus/resolve?hostname=${encodeURIComponent(hostname)}`,
    { cache: "force-cache" }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.tenant;
}

async function fetchCoursesInternal(
  slug: string,
  limit: number
): Promise<Course[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const response = await fetch(`${API_URL}/campus/courses?${params.toString()}`, {
    headers: { "X-Tenant-Slug": slug },
    cache: "force-cache",
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.courses;
}

export const fetchTenantBySlug = cache(fetchTenantBySlugInternal);
export const fetchTenantByCustomDomain = cache(fetchTenantByCustomDomainInternal);
export const fetchCourses = cache(fetchCoursesInternal);
