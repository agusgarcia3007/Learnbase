import { createFileRoute } from "@tanstack/react-router";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

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

export const Route = createFileRoute("/api/og/home")({
  server: {
    handlers: {
      GET: async () => {
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
                "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
              padding: "60px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <img
                src="https://cdn.uselearnbase.com/logo.png"
                alt=""
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  objectFit: "cover",
                }}
              />
              <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>
                LearnBase
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
                  fontSize: "64px",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  marginBottom: "24px",
                  maxWidth: "900px",
                }}
              >
                Create Your AI-Powered Online Academy
              </h1>
              <p
                style={{
                  color: "#a5b4fc",
                  fontSize: "28px",
                  lineHeight: 1.4,
                  maxWidth: "800px",
                }}
              >
                Auto-generate courses from videos. Handle payments. Scale your educational business.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "32px",
                borderTop: "1px solid rgba(165, 180, 252, 0.2)",
                paddingTop: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "6px",
                    background: "#22c55e",
                  }}
                />
                <span style={{ color: "#94a3b8", fontSize: "18px" }}>
                  AI-Powered
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "6px",
                    background: "#22c55e",
                  }}
                />
                <span style={{ color: "#94a3b8", fontSize: "18px" }}>
                  White-Label
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "6px",
                    background: "#22c55e",
                  }}
                />
                <span style={{ color: "#94a3b8", fontSize: "18px" }}>
                  Payments Built-In
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
