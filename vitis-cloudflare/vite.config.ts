import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Build para Cloudflare Workers (preset cloudflare-module).
// Não adicione compressão: o Cloudflare já comprime na borda.
export default defineConfig(({ command }) => ({
  server: { host: "::", port: 8080 },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  css: { transformer: "lightningcss" },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
    }),
    ...(command === "build"
      ? [nitro({ preset: "cloudflare-module", cloudflare: { nodeCompat: true, deployConfig: true } })]
      : []),
    viteReact(),
  ],
}));
