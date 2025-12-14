import { createFileRoute } from "@tanstack/react-router";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getCampusCourseServer } from "@/services/campus/server";
import { getTenantFromRequest } from "@/lib/tenant.server";

const WIDTH = 1200;
const HEIGHT = 630;

async function loadGoogleFont(
  font: string,
  weight: number
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@${weight}&display=swap`;
  const css = await fetch(url).then((res) => res.text());
  const match = css.match(
    /src: url\((.+?)\) format\('(woff2|woff|truetype)'\)/
  );
  if (!match) {
    throw new Error(`Could not find font URL for ${font}`);
  }
  return fetch(match[1]).then((res) => res.arrayBuffer());
}

export const Route = createFileRoute("/api/og/course/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const tenantInfo = await getTenantFromRequest({ data: {} });
        if (!tenantInfo.slug) {
          return new Response("Tenant not found", { status: 404 });
        }

        const courseData = await getCampusCourseServer({
          data: { tenantSlug: tenantInfo.slug, courseSlug: params.slug },
        });

        if (!courseData?.course) {
          return new Response("Course not found", { status: 404 });
        }

        const course = courseData.course;
        const instructorName = course.instructor?.name || "";

        const [interBold, interRegular] = await Promise.all([
          loadGoogleFont("Inter", 700),
          loadGoogleFont("Inter", 400),
        ]);

        const svg = await satori(
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              padding: "60px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "40px",
              }}
            >
              <img
                src="https://cdn.uselearnbase.com/logo.png"
                alt=""
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  objectFit: "cover",
                }}
              />
              <span style={{ color: "#94a3b8", fontSize: "24px", fontWeight: 400 }}>
                {tenantInfo.slug}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {course.categories?.[0] && (
                <div style={{ display: "flex", marginBottom: "20px" }}>
                  <span
                    style={{
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#818cf8",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "18px",
                      fontWeight: 500,
                    }}
                  >
                    {course.categories[0].name}
                  </span>
                </div>
              )}
              <h1
                style={{
                  color: "white",
                  fontSize: course.title.length > 50 ? "48px" : "56px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: "24px",
                  maxWidth: "900px",
                }}
              >
                {course.title}
              </h1>
              {course.shortDescription && (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "24px",
                    lineHeight: 1.5,
                    maxWidth: "800px",
                  }}
                >
                  {course.shortDescription.length > 120
                    ? course.shortDescription.slice(0, 120) + "..."
                    : course.shortDescription}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(148, 163, 184, 0.2)",
                paddingTop: "30px",
              }}
            >
              {instructorName && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "22px",
                      background: "#374151",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{ color: "white", fontSize: "18px", fontWeight: 600 }}
                    >
                      {instructorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span style={{ color: "#e2e8f0", fontSize: "20px" }}>
                    {instructorName}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                {course.modulesCount > 0 && (
                  <span style={{ color: "#94a3b8", fontSize: "18px" }}>
                    {course.modulesCount} modules
                  </span>
                )}
                {course.itemsCount > 0 && (
                  <span style={{ color: "#94a3b8", fontSize: "18px" }}>
                    {course.itemsCount} lessons
                  </span>
                )}
              </div>
            </div>
          </div>,
          {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
              { name: "Inter", data: interBold, weight: 700, style: "normal" },
              { name: "Inter", data: interRegular, weight: 400, style: "normal" },
            ],
          }
        );

        const resvg = new Resvg(svg, {
          fitTo: { mode: "width", value: WIDTH },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return new Response(pngBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, s-maxage=604800",
          },
        });
      },
    },
  },
});
