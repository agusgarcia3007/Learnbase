import { useEffect } from "react";

type SeoProps = {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  image?: string | null;
};

function setMetaTag(
  selector: string,
  attribute: "name" | "property",
  attrValue: string,
  content: string
) {
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, attrValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export function useSeo({ title, description, keywords, image }: SeoProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMetaTag('meta[property="og:title"]', "property", "og:title", title);
      setMetaTag(
        'meta[name="twitter:title"]',
        "name",
        "twitter:title",
        title
      );
    }
  }, [title]);

  useEffect(() => {
    if (description) {
      setMetaTag('meta[name="description"]', "name", "description", description);
      setMetaTag(
        'meta[property="og:description"]',
        "property",
        "og:description",
        description
      );
      setMetaTag(
        'meta[name="twitter:description"]',
        "name",
        "twitter:description",
        description
      );
    }
  }, [description]);

  useEffect(() => {
    if (keywords) {
      setMetaTag('meta[name="keywords"]', "name", "keywords", keywords);
    }
  }, [keywords]);

  useEffect(() => {
    if (image) {
      setMetaTag('meta[property="og:image"]', "property", "og:image", image);
      setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", image);
    }
  }, [image]);
}
