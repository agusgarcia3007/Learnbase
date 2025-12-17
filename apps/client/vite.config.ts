import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const nativeModules = [
  "@resvg/resvg-js",
  "@resvg/resvg-js-darwin-arm64",
  "@resvg/resvg-js-darwin-x64",
  "@resvg/resvg-js-linux-x64-gnu",
  "@resvg/resvg-js-linux-x64-musl",
  "@resvg/resvg-js-win32-x64-msvc",
];

export default defineConfig({
  plugins: [
    nitro({
      preset: "bun",
      noExternals: true,
      rollupConfig: {
        external: nativeModules,
      },
    }),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
  optimizeDeps: {
    exclude: nativeModules,
  },
  ssr: {
    external: nativeModules,
    noExternal: [],
  },
});
