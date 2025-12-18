export type TenantInfo = {
  slug: string | null;
  isCampus: boolean;
  isCustomDomain: boolean;
};

const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app"];
export const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "uselearnbase.com";
let resolvedCustomDomainSlug: string | null = null;

export function setResolvedSlug(slug: string): void {
  resolvedCustomDomainSlug = slug;
}

export function getResolvedSlug(): string | null {
  return resolvedCustomDomainSlug;
}

function isOurDomain(hostname: string): boolean {
  return hostname === BASE_DOMAIN || hostname.endsWith(`.${BASE_DOMAIN}`);
}

export function getTenantFromHost(): TenantInfo {
  if (typeof window === "undefined") {
    return { slug: null, isCampus: false, isCustomDomain: false };
  }

  if (process.env.NODE_ENV === "development") {
    const url = new URL(window.location.href);
    const campusSlug = url.searchParams.get("campus");

    if (campusSlug) {
      return { slug: campusSlug, isCampus: true, isCustomDomain: false };
    }
  }

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return { slug: null, isCampus: false, isCustomDomain: false };
  }

  if (isOurDomain(hostname)) {
    const parts = hostname.split(".");
    if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
      return { slug: parts[0], isCampus: true, isCustomDomain: false };
    }
    return { slug: null, isCampus: false, isCustomDomain: false };
  }

  return { slug: null, isCampus: true, isCustomDomain: true };
}

export function getCampusUrl(slug: string, customDomain?: string | null): string {
  const { protocol } = window.location;

  if (customDomain) {
    return `${protocol}//${customDomain}`;
  }

  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  return `${protocol}//${slug}.${baseDomain}`;
}

export function getMainDomainUrl(): string {
  if (typeof window === "undefined") {
    return `https://${BASE_DOMAIN}`;
  }

  const { protocol } = window.location;
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  return `${protocol}//${baseDomain}`;
}

export function getTenantSlugFromHostname(hostname: string): string | null {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (isOurDomain(hostname)) {
    const parts = hostname.split(".");
    if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  return null;
}
