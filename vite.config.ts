import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import { cloescePlugin } from "./plugins/vite-plugin-cloesce";
import vinext from "vinext";
import svgr from "vite-plugin-svgr";

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number.parseInt(env.PORT ?? "", 10) || 5173;

  return {
    plugins: [
      cloescePlugin(),
      vinext(),
      svgr(),
      cloudflare({
        viteEnvironment: { childEnvironments: ["ssr"], name: "rsc" },
      }),
    ],
    server: {
      port,
      allowedHosts: true,
    },
  };
});

export default config;
