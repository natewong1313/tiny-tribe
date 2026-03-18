import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { cloescePlugin } from "./plugins/vite-plugin-cloesce";
import vinext from "vinext";
import svgr from "vite-plugin-svgr";

const config = defineConfig({
  plugins: [
    cloescePlugin(),
    vinext(),
    svgr(),
    cloudflare({
      viteEnvironment: { childEnvironments: ["ssr"], name: "rsc" },
    }),
  ],
  server: {
    allowedHosts: true,
  },
});

export default config;
