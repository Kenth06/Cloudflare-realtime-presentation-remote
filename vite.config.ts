import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), cloudflare()],
  esbuild: {
    target: "es2022",
  },
  appType: "spa",
});
