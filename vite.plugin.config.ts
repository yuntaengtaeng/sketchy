import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/plugin/main.ts",
      formats: ["iife"],
      name: "SketchyPlugin",
      fileName: () => "plugin.js",
    },
  },
});
