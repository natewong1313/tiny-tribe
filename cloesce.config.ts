import { defineConfig } from "cloesce/config";

export default defineConfig({
  srcPaths: ["./src/data"],
  outPath: ".generated",
  workersUrl: "http://localhost:3000/api/cloesce",
});
