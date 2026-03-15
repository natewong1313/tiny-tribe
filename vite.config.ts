import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { cloescePlugin } from "./plugins/vite-plugin-cloesce";
import vinext from "vinext";

const config = defineConfig({
  plugins: [
    cloescePlugin(),
    vinext(),
    cloudflare({
      viteEnvironment: { childEnvironments: ["ssr"], name: "rsc" },
    }),
  ],
});

export default config;
