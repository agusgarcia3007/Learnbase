import { createFileRoute } from "@tanstack/react-router";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getCampusTenantServer } from "@/services/campus/server";
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

export const Route = createFileRoute("/api/og/campus")({
  server: {
    handlers: {
      GET: async () => {
        const tenantInfo = await getTenantFromRequest({ data: {} });
        if (!tenantInfo.slug) {
          return new Response("Tenant not found", { status: 404 });
        }

        const tenantData = await getCampusTenantServer({
          data: { slug: tenantInfo.slug },
        });

        if (!tenantData?.tenant) {
          return new Response("Tenant not found", { status: 404 });
        }

        const tenant = tenantData.tenant;

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
                gap: "20px",
              }}
            >
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt=""
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>
                    {tenant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span style={{ color: "white", fontSize: "36px", fontWeight: 700 }}>
                {tenant.name}
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
              <h1
                style={{
                  color: "white",
                  fontSize: tenant.heroTitle && tenant.heroTitle.length > 40 ? "52px" : "60px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: "24px",
                  maxWidth: "900px",
                }}
              >
                {tenant.heroTitle || tenant.seoTitle || tenant.name}
              </h1>
              {(tenant.heroSubtitle || tenant.seoDescription) && (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "26px",
                    lineHeight: 1.5,
                    maxWidth: "800px",
                  }}
                >
                  {(() => {
                    const text = tenant.heroSubtitle || tenant.seoDescription || "";
                    return text.length > 120 ? text.slice(0, 120) + "..." : text;
                  })()}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderTop: "1px solid rgba(148, 163, 184, 0.2)",
                paddingTop: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <img
                  src="https://cdn.uselearnbase.com/logo.png"
                  alt=""
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    objectFit: "cover",
                  }}
                />
                <span style={{ color: "#64748b", fontSize: "18px" }}>
                  Powered by LearnBase
                </span>
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
