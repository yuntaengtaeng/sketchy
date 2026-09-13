import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/mcp/server.ts",
    outDir: "mcpb/server",
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "index.js" } },
  },
  ssr: { noExternal: true },
});
