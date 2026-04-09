import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  esbuild: {
    target: "es2022",
  },
  appType: "spa",
});
