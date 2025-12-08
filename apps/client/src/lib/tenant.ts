type TenantInfo = {
  slug: string | null;
  isCampus: boolean;
  isCustomDomain: boolean;
};

const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app"];
const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "learnbase.lat";

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
  if (import.meta.env.DEV) {
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
  const { protocol } = window.location;
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  return `${protocol}//${baseDomain}`;
}
