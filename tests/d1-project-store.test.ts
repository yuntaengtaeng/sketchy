import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import { D1ProjectStore } from "../src/api/d1-project-store.ts";
import type { ProjectDocument } from "../src/core/project-change.ts";

test("stores Projects and replaces only the expected D1 revision", async () => {
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      d1Databases: ["DB"],
    }),
  );
  try {
    const database = await miniflare.getD1Database("DB");
    const migration = await readFile("migrations/0001_projects.sql", "utf8");
    await database.exec(migration.replace(/\s+/g, " "));
    const store = new D1ProjectStore(database);
    const document: ProjectDocument = {
      id: "project",
      revision: 0,
      updatedAt: "2026-09-13T00:00:00.000Z",
      project: {
        settings: { screenPreset: "mobile", showFlowArrows: true },
        screens: [],
        elements: [],
        features: [],
      },
    };

    assert.equal(await store.create({ ownerId: "owner", document }), true);
    assert.equal(await store.create({ ownerId: "owner", document }), false);
    assert.equal((await store.get(document.id))?.ownerId, "owner");

    const changed = {
      ...document,
      revision: 1,
      updatedAt: "2026-09-13T00:01:00.000Z",
    };
    assert.equal(
      await store.replace({ ownerId: "owner", document: changed }, 0),
      true,
    );
    assert.equal(
      await store.replace({ ownerId: "owner", document: changed }, 0),
      false,
    );
    assert.equal((await store.get(document.id))?.document.revision, 1);
  } finally {
    await miniflare.dispose();
  }
});
