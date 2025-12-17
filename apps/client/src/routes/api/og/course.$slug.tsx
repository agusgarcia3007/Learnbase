import { createFileRoute } from "@tanstack/react-router";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getCampusCourseServer, getCampusTenantServer } from "@/services/campus/server";
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

        const [courseData, tenantData] = await Promise.all([
          getCampusCourseServer({
            data: { tenantSlug: tenantInfo.slug, courseSlug: params.slug },
          }),
          getCampusTenantServer({
            data: { slug: tenantInfo.slug },
          }),
        ]);

        if (!courseData?.course) {
          return new Response("Course not found", { status: 404 });
        }

        const course = courseData.course;
        const tenant = tenantData?.tenant;

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
              position: "relative",
            }}
          >
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt=""
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: course.thumbnail
                  ? "rgba(0, 0, 0, 0.65)"
                  : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
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
                {tenant?.logo ? (
                  <img
                    src={tenant.logo}
                    alt=""
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "14px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "14px",
                      background: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "white", fontSize: "28px", fontWeight: 700 }}>
                      {(tenant?.name || tenantInfo.slug || "").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span style={{ color: "white", fontSize: "28px", fontWeight: 700 }}>
                  {tenant?.name || tenantInfo.slug}
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
                        background: "rgba(99, 102, 241, 0.3)",
                        color: "#a5b4fc",
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
                      color: "#cbd5e1",
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
                  gap: "24px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                  paddingTop: "30px",
                }}
              >
                {course.modulesCount > 0 && (
                  <span style={{ color: "#e2e8f0", fontSize: "18px" }}>
                    {course.modulesCount} modules
                  </span>
                )}
                {course.itemsCount > 0 && (
                  <span style={{ color: "#e2e8f0", fontSize: "18px" }}>
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
