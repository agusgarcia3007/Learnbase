type TenantInfo = {
  slug: string | null;
  isCampus: boolean;
};

const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app"];

export function getTenantFromHost(): TenantInfo {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
    return { slug: parts[0], isCampus: true };
  }

  return { slug: null, isCampus: false };
}

export function getCampusUrl(slug: string): string {
  const { protocol } = window.location;
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
