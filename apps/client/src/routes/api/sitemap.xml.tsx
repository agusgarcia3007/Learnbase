import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://uselearnbase.com";

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

function buildSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      let entry = `  <url>\n    <loc>${url.loc}</loc>`;
      if (url.lastmod) {
        entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
      }
      if (url.changefreq) {
        entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
      }
      if (url.priority !== undefined) {
        entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
      }
      entry += "\n  </url>";
      return entry;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export const Route = createFileRoute("/api/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];

        const staticUrls: SitemapUrl[] = [
          {
            loc: BASE_URL,
            lastmod: today,
            changefreq: "weekly",
            priority: 1.0,
          },
          {
            loc: `${BASE_URL}/login`,
            changefreq: "monthly",
            priority: 0.3,
          },
          {
            loc: `${BASE_URL}/signup`,
            changefreq: "monthly",
            priority: 0.5,
          },
        ];

        const xml = buildSitemapXml(staticUrls);

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
