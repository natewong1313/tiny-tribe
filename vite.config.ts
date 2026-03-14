import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";
import { cloescePlugin } from "./plugins/vite-plugin-cloesce";

export default defineConfig({
  plugins: [
    cloescePlugin(),
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
