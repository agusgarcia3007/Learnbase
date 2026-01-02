export const CDN_URL = "https://cdn.uselearnbase.com";

export const siteData = {
  name: "Learnbase",
  color: "#0052cc",
  logo: `${CDN_URL}/logo.png`,
};

export function getAssetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${CDN_URL}/${path}`;
}
