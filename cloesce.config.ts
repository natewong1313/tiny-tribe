import { defineConfig } from "cloesce/config";

export default defineConfig({
  srcPaths: ["./src/data"],
  projectName: "tiny-tribe",
  workersUrl: "http://localhost:3000/api/cloesce",
  migrationsPath: "./migrations",
});
