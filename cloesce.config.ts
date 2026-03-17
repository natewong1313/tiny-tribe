import { defineConfig } from "cloesce/config";

const config = defineConfig({
  migrationsPath: "./migrations",
  projectName: "tiny-tribe",
  srcPaths: ["./src/data"],
  workersUrl: process.env.CLOESCE_WORKER_URL,
});

export default config;
