type SeoParams = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  keywords?: string | null;
};

export function seo({ title, description, image, keywords }: SeoParams) {
  const meta: Array<Record<string, string>> = [];

  if (title) {
    meta.push({ title });
    meta.push({ property: "og:title", content: title });
    meta.push({ name: "twitter:title", content: title });
  }

  if (description) {
    meta.push({ name: "description", content: description });
    meta.push({ property: "og:description", content: description });
    meta.push({ name: "twitter:description", content: description });
  }

  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }

  if (keywords) {
    meta.push({ name: "keywords", content: keywords });
  }

  meta.push({ property: "og:type", content: "website" });
  meta.push({ name: "twitter:card", content: "summary_large_image" });

  return meta;
}
