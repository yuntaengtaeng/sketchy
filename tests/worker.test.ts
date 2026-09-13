import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import { handleRequest } from "../src/worker.ts";

test("serves the Project API with a Worker D1 binding", async () => {
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      d1Databases: ["DB"],
    }),
  );
  try {
    const DB = await miniflare.getD1Database("DB");
    const migration = await readFile("migrations/0001_projects.sql", "utf8");
    await DB.exec(migration.replace(/\s+/g, " "));
    const environment = {
      DB,
      SKETCHY_API_TOKEN: "secret",
      SKETCHY_USER_ID: "developer",
    };
    const document = {
      id: "worker-project",
      revision: 0,
      updatedAt: "2026-09-13T00:00:00.000Z",
      project: {
        settings: { screenPreset: "mobile" as const },
        screens: [],
        elements: [],
        features: [],
      },
    };

    const created = await handleRequest(
      new Request("https://sketchy.test/api/v1/projects", {
        method: "POST",
        headers: {
          authorization: "Bearer secret",
          "content-type": "application/json",
        },
        body: JSON.stringify(document),
      }),
      environment,
    );
    assert.equal(created.status, 201);

    const project = await handleRequest(
      new Request("https://sketchy.test/api/v1/projects/worker-project", {
        headers: { authorization: "Bearer secret" },
      }),
      environment,
    );
    assert.equal(project.status, 200);
    assert.equal(
      (await project.text()).includes('"id":"worker-project"'),
      true,
    );
  } finally {
    await miniflare.dispose();
  }
});
