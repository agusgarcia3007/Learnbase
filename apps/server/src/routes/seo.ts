import { Elysia } from "elysia";
import { db } from "@/db";
import { coursesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://uselearnbase.com";

function generateSitemapXml(
  urls: Array<{
    loc: string;
    lastmod?: string;
    priority?: number;
    changefreq?: string;
  }>
) {
  const urlEntries = urls
    .map(
      ({ loc, lastmod, priority = 0.5, changefreq = "weekly" }) => `
  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export const seoRoutes = new Elysia({ name: "seo" })
  .get("/sitemap.xml", async ({ set }) => {
    set.headers["content-type"] = "application/xml";

    const staticPages = [
      { loc: BASE_URL, priority: 1.0, changefreq: "daily" },
      { loc: `${BASE_URL}/courses`, priority: 0.9, changefreq: "daily" },
    ];

    const courses = await db
      .select({
        slug: coursesTable.slug,
        updatedAt: coursesTable.updatedAt,
      })
      .from(coursesTable)
      .where(eq(coursesTable.status, "published"))
      .limit(1000);

    const courseUrls = courses.map((course) => ({
      loc: `${BASE_URL}/courses/${course.slug}`,
      lastmod: course.updatedAt?.toISOString().split("T")[0],
      priority: 0.8,
      changefreq: "weekly" as const,
    }));

    const allUrls = [...staticPages, ...courseUrls];

    return generateSitemapXml(allUrls);
  })
  .get("/robots.txt", ({ set }) => {
    set.headers["content-type"] = "text/plain";

    return `# LearnBase robots.txt

User-agent: *
Allow: /
Allow: /courses
Allow: /courses/*

Disallow: /backoffice
Disallow: /backoffice/*
Disallow: /profile
Disallow: /profile/*
Disallow: /my-courses
Disallow: /my-courses/*
Disallow: /api/

Crawl-delay: 1

Sitemap: ${BASE_URL}/sitemap.xml
`;
  });
