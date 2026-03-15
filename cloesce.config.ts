import { defineConfig } from "cloesce/config";

const config = defineConfig({
  migrationsPath: "./migrations",
  projectName: "tiny-tribe",
  srcPaths: ["./src/data"],
  workersUrl: "http://localhost:3000/api/cloesce",
});

export default config;
