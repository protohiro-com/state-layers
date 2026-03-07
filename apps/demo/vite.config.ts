import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/state-layers/",
  plugins: [react()],
  server: {
    port: 4173
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ["libs.protohiro.com"]
  },
  resolve: {
    alias: {
      "@protohiro/state-layers": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url))
    }
  }
});
