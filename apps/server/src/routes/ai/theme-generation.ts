import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import {
  withUserContext,
  createTelemetryConfig,
} from "@/lib/ai/telemetry";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { generateObject } from "ai";
import { AI_MODELS } from "@/lib/ai/models";
import { THEME_GENERATION_PROMPT } from "@/lib/ai/prompts";
import { hexToOklch } from "@/lib/ai/color-utils";
import { logger } from "@/lib/logger";

type StyleConfig = {
  chroma: string;
  radius: string;
  secondary: string;
  accent: string;
  fontHeading: string;
  fontBody: string;
  shadowStyle: string;
};

const styleConfigs: Record<string, StyleConfig> = {
  retro: {
    chroma: "muted (0.08-0.12)",
    radius: "0.25rem",
    secondary: "warm beige/cream tones",
    accent: "warm muted complement",
    fontHeading: "Playfair Display",
    fontBody: "Lora",
    shadowStyle: "soft, warm-tinted shadows with sepia undertones",
  },
  vintage: {
    chroma: "muted (0.08-0.12)",
    radius: "0.25rem",
    secondary: "warm sepia tones",
    accent: "dusty warm color",
    fontHeading: "Cormorant Garamond",
    fontBody: "Source Serif Pro",
    shadowStyle: "soft, diffuse shadows with warm brown tint",
  },
  modern: {
    chroma: "vibrant (0.15-0.22)",
    radius: "0.5rem",
    secondary: "neutral gray",
    accent: "same hue, higher chroma",
    fontHeading: "Inter",
    fontBody: "Inter",
    shadowStyle: "crisp, clean shadows with neutral gray color",
  },
  minimal: {
    chroma: "clean (0.12-0.18)",
    radius: "0.375rem",
    secondary: "very light neutral",
    accent: "subtle primary variant",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Plus Jakarta Sans",
    shadowStyle: "subtle, barely visible shadows for depth",
  },
  corporate: {
    chroma: "conservative (0.10-0.15)",
    radius: "0.375rem",
    secondary: "cool professional gray",
    accent: "trustworthy blue tone",
    fontHeading: "Roboto",
    fontBody: "Open Sans",
    shadowStyle: "professional, medium shadows with cool gray tone",
  },
  professional: {
    chroma: "conservative (0.10-0.15)",
    radius: "0.375rem",
    secondary: "neutral slate",
    accent: "subtle complement",
    fontHeading: "Source Sans Pro",
    fontBody: "Source Sans Pro",
    shadowStyle: "clean, balanced shadows with neutral color",
  },
  playful: {
    chroma: "bright (0.20-0.30)",
    radius: "1rem",
    secondary: "vibrant complement",
    accent: "bright contrasting color",
    fontHeading: "Fredoka",
    fontBody: "Nunito",
    shadowStyle: "bold, colorful shadows tinted with primary color",
  },
  fun: {
    chroma: "saturated (0.22-0.30)",
    radius: "1rem",
    secondary: "energetic complement",
    accent: "pop of bright color",
    fontHeading: "Baloo 2",
    fontBody: "Quicksand",
    shadowStyle: "bold, vibrant shadows with color accent",
  },
  futuristic: {
    chroma: "neon (0.25-0.35)",
    radius: "0rem",
    secondary: "dark cool gray",
    accent: "bright neon/cyan",
    fontHeading: "Space Grotesk",
    fontBody: "JetBrains Mono",
    shadowStyle: "neon glow effect with cyan/blue tint and large spread",
  },
  elegant: {
    chroma: "refined (0.12-0.18)",
    radius: "0.5rem",
    secondary: "warm neutral",
    accent: "gold or rose tone",
    fontHeading: "Cormorant",
    fontBody: "Lato",
    shadowStyle: "refined, subtle shadows with warm undertones",
  },
  luxury: {
    chroma: "rich (0.14-0.20)",
    radius: "0.5rem",
    secondary: "deep warm neutral",
    accent: "gold or champagne",
    fontHeading: "Playfair Display",
    fontBody: "Montserrat",
    shadowStyle: "rich, deep shadows with slight gold/warm tint",
  },
};

function buildThemeSchema(styleConfig: StyleConfig, colorInstruction: string) {
  return z.object({
    background: z.string().describe(
      "Page background. Light mode: oklch(1 0 0) pure white or very subtle tint."
    ),
    foreground: z.string().describe(
      "Default text color. Very dark: L 0.14-0.18, C 0.005-0.01. Example: oklch(0.145 0.005 285)"
    ),
    card: z.string().describe(
      "Card/surface background. Usually same as background or slightly tinted."
    ),
    cardForeground: z.string().describe(
      "Text on cards. Usually same as foreground."
    ),
    popover: z.string().describe(
      "Popover/dropdown background. Usually same as card."
    ),
    popoverForeground: z.string().describe(
      "Text in popovers. Usually same as foreground."
    ),
    primary: z.string().describe(
      `Primary brand color for buttons and links. ${colorInstruction}`
    ),
    primaryForeground: z.string().describe(
      "Text on primary. If primary L < 0.6, use oklch(0.98 0 0). If >= 0.6, use oklch(0.15 0 0)."
    ),
    secondary: z.string().describe(
      "Secondary surfaces/hover states. Very light: L 0.94-0.97, C 0.01-0.02."
    ),
    secondaryForeground: z.string().describe(
      "Text on secondary. Dark: L 0.15-0.25."
    ),
    muted: z.string().describe(
      "Muted backgrounds. Similar to secondary. L 0.94-0.97, C 0.01-0.02."
    ),
    mutedForeground: z.string().describe(
      "Subdued text color. L 0.45-0.55."
    ),
    accent: z.string().describe(
      `Accent for badges/highlights. ${styleConfig.accent}. Complement primary with analogous (+/-30) or complementary (+180) hue.`
    ),
    accentForeground: z.string().describe(
      "Text on accent. If accent L < 0.6, use oklch(0.98 0 0). If >= 0.6, use oklch(0.15 0 0)."
    ),
    destructive: z.string().describe(
      "Error/danger color. Red-orange hue (H 15-30), L 0.55-0.60, C 0.22-0.26."
    ),
    destructiveForeground: z.string().describe(
      "Text on destructive. Usually oklch(0.98 0 0)."
    ),
    border: z.string().describe(
      "Border color. Light gray: L 0.90-0.93, very low C."
    ),
    input: z.string().describe(
      "Input borders. Same as border or slightly darker."
    ),
    ring: z.string().describe(
      "Focus ring with alpha. Format: oklch(L C H / 0.15). Use primary hue, L around 0.6."
    ),
    chart1: z.string().describe(
      "Chart color 1. Use primary hue, L 0.70-0.80."
    ),
    chart2: z.string().describe(
      "Chart color 2. Primary hue +60 degrees, L 0.65-0.75."
    ),
    chart3: z.string().describe(
      "Chart color 3. Primary hue +120 degrees, L 0.55-0.65."
    ),
    chart4: z.string().describe(
      "Chart color 4. Primary hue +180 degrees, L 0.50-0.60."
    ),
    chart5: z.string().describe(
      "Chart color 5. Primary hue +240 degrees, L 0.45-0.55."
    ),
    sidebar: z.string().describe(
      "Sidebar background. Slightly off-white: L 0.98-0.99."
    ),
    sidebarForeground: z.string().describe(
      "Sidebar text. Same as foreground."
    ),
    sidebarPrimary: z.string().describe(
      "Sidebar primary. Same as primary or slightly adjusted."
    ),
    sidebarPrimaryForeground: z.string().describe(
      "Text on sidebar primary. Same as primaryForeground."
    ),
    sidebarAccent: z.string().describe(
      "Sidebar accent. Same as secondary."
    ),
    sidebarAccentForeground: z.string().describe(
      "Text on sidebar accent. Same as secondaryForeground."
    ),
    sidebarBorder: z.string().describe(
      "Sidebar borders. Same as border."
    ),
    sidebarRing: z.string().describe(
      "Sidebar focus ring. Neutral gray with alpha."
    ),
    shadow: z.string().describe(
      `Card shadow. ${styleConfig.shadowStyle}. Format: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
    ),
    shadowLg: z.string().describe(
      "Large shadow for modals. Format: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
    ),
    radius: z.string().describe(
      `Border radius CSS value. Use exactly: ${styleConfig.radius}`
    ),
    backgroundDark: z.string().describe(
      "Dark mode page background. Very dark: L 0.12-0.16, C 0.005-0.01."
    ),
    foregroundDark: z.string().describe(
      "Dark mode text. Near white: L 0.98-0.99."
    ),
    cardDark: z.string().describe(
      "Dark mode card background. Slightly lighter than background: L 0.18-0.22."
    ),
    cardForegroundDark: z.string().describe(
      "Dark mode card text. Same as foregroundDark."
    ),
    popoverDark: z.string().describe(
      "Dark mode popover. Same as cardDark."
    ),
    popoverForegroundDark: z.string().describe(
      "Dark mode popover text. Same as foregroundDark."
    ),
    primaryDark: z.string().describe(
      "Dark mode primary. Same hue, increase L by 0.08-0.12 for visibility."
    ),
    primaryForegroundDark: z.string().describe(
      "Dark mode text on primary. Usually oklch(0.98 0 0)."
    ),
    secondaryDark: z.string().describe(
      "Dark mode secondary. Dark: L 0.22-0.28, C 0.01-0.02."
    ),
    secondaryForegroundDark: z.string().describe(
      "Dark mode text on secondary. Light: L 0.90-0.95."
    ),
    mutedDark: z.string().describe(
      "Dark mode muted. Same as secondaryDark."
    ),
    mutedForegroundDark: z.string().describe(
      "Dark mode subdued text. L 0.60-0.70."
    ),
    accentDark: z.string().describe(
      "Dark mode accent. Same hue, increase L by 0.05-0.10."
    ),
    accentForegroundDark: z.string().describe(
      "Dark mode text on accent. Match accentForeground logic."
    ),
    destructiveDark: z.string().describe(
      "Dark mode destructive. Same hue, L 0.65-0.72, C 0.18-0.22."
    ),
    destructiveForegroundDark: z.string().describe(
      "Dark mode text on destructive. Usually oklch(0.98 0 0)."
    ),
    borderDark: z.string().describe(
      "Dark mode border. White with alpha: oklch(1 0 0 / 10%)."
    ),
    inputDark: z.string().describe(
      "Dark mode input border. oklch(1 0 0 / 15%)."
    ),
    ringDark: z.string().describe(
      "Dark mode focus ring. oklch(L C H / 0.25). Same H as primary, L around 0.7."
    ),
    chart1Dark: z.string().describe(
      "Dark mode chart 1. Same hue as chart1, increase L slightly."
    ),
    chart2Dark: z.string().describe(
      "Dark mode chart 2. Same hue as chart2, increase L slightly."
    ),
    chart3Dark: z.string().describe(
      "Dark mode chart 3. Same hue as chart3, increase L slightly."
    ),
    chart4Dark: z.string().describe(
      "Dark mode chart 4. Same hue as chart4, increase L slightly."
    ),
    chart5Dark: z.string().describe(
      "Dark mode chart 5. Same hue as chart5, increase L slightly."
    ),
    sidebarDark: z.string().describe(
      "Dark mode sidebar. Slightly lighter than backgroundDark: L 0.18-0.22."
    ),
    sidebarForegroundDark: z.string().describe(
      "Dark mode sidebar text. Same as foregroundDark."
    ),
    sidebarPrimaryDark: z.string().describe(
      "Dark mode sidebar primary. Same as primaryDark."
    ),
    sidebarPrimaryForegroundDark: z.string().describe(
      "Dark mode sidebar primary text. Same as primaryForegroundDark."
    ),
    sidebarAccentDark: z.string().describe(
      "Dark mode sidebar accent. Same as secondaryDark."
    ),
    sidebarAccentForegroundDark: z.string().describe(
      "Dark mode sidebar accent text. Same as secondaryForegroundDark."
    ),
    sidebarBorderDark: z.string().describe(
      "Dark mode sidebar border. Same as borderDark."
    ),
    sidebarRingDark: z.string().describe(
      "Dark mode sidebar ring. Neutral gray with alpha."
    ),
    shadowDark: z.string().describe(
      "Dark mode shadow. Same format, increase opacity: 0.3 instead of 0.1."
    ),
    shadowLgDark: z.string().describe(
      "Dark mode large shadow. Same format, increase opacity."
    ),
    fontHeading: z.string().describe(
      `Heading font. Use exactly: "${styleConfig.fontHeading}"`
    ),
    fontBody: z.string().describe(
      `Body font. Use exactly: "${styleConfig.fontBody}"`
    ),
  });
}

export const themeGenerationRoutes = new Elysia({ name: "ai-theme-generation" })
  .use(authPlugin)
  .post(
    "/themes/generate",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "User has no tenant",
            404
          );
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can generate themes",
            403
          );
        }

        const { primaryColor, style } = ctx.body;

        const normalizedStyle = style?.toLowerCase().trim() || "";
        const styleConfig = styleConfigs[normalizedStyle] || styleConfigs.modern;

        const primaryOklch = primaryColor ? hexToOklch(primaryColor) : null;

        const colorInstruction = primaryOklch
          ? `Use EXACTLY this value as primary: ${primaryOklch}. Do not modify.`
          : `Choose a creative color for style "${style || "modern"}" with chroma ${styleConfig.chroma}`;

        logger.info("Generating custom theme with AI", {
          tenantId: ctx.user.tenantId,
          hasPrimaryColor: !!primaryColor,
          style: style || "default",
        });

        const generationStart = Date.now();

        const themeSchema = buildThemeSchema(styleConfig, colorInstruction);

        const theme = await withUserContext(
          {
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            operationName: "theme-generation",
            metadata: { style: style || "default" },
          },
          async () => {
            const { object } = await generateObject({
              model: aiGateway(AI_MODELS.THEME_GENERATION),
              prompt: THEME_GENERATION_PROMPT,
              schema: themeSchema,
              temperature: 0.7,
              ...createTelemetryConfig("theme-color-generation"),
            });

            const generationTime = Date.now() - generationStart;

            logger.info("Theme generation completed", {
              generationTime: `${generationTime}ms`,
            });

            return object;
          }
        );

        return { theme };
      }),
    {
      body: t.Object({
        primaryColor: t.Optional(t.String()),
        style: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI"],
        summary: "Generate a custom color theme using AI",
      },
    }
  );
