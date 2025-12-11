import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    nitro({
      preset: "bun",
    }),
    tanstackStart({
      prerender: {
        enabled: false,
      },
    }),
    react(),
    tailwindcss(),
  ],
});
