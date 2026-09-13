import { mkdir, readFile, writeFile } from "node:fs/promises";
import { zipSync } from "fflate";

const files = {
  "manifest.json": await readFile("mcpb/manifest.json"),
  "server/index.js": await readFile("mcpb/server/index.js"),
};

await mkdir("dist", { recursive: true });
await writeFile("dist/sketchy.mcpb", zipSync(files, { level: 9 }));
