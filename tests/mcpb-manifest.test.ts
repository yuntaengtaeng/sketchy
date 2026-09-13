import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("configures the Claude Desktop bundle with a project file picker", async () => {
  const manifest = JSON.parse(await readFile("mcpb/manifest.json", "utf8"));

  assert.equal(manifest.manifest_version, "0.3");
  assert.equal(manifest.server.type, "node");
  assert.equal(manifest.server.entry_point, "server/index.js");
  assert.deepEqual(manifest.server.mcp_config.args, [
    "${__dirname}/server/index.js",
    "--project",
    "${user_config.project_file}",
  ]);
  assert.equal(manifest.user_config.project_file.type, "file");
  assert.equal(manifest.user_config.project_file.required, true);
});
