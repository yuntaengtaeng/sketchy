import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import {
  createBearerAuthenticator,
  sha256,
} from "../src/api/authentication.ts";

test("authenticates an unexpired Sketchy session", async () => {
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      d1Databases: ["DB"],
    }),
  );
  try {
    const database = await miniflare.getD1Database("DB");
    await database.exec(
      (await readFile("migrations/0002_auth.sql", "utf8")).replace(/\s+/g, " "),
    );
    await database
      .prepare("INSERT INTO users (id, created_at) VALUES (?, ?)")
      .bind("user-1", "2026-09-13T00:00:00.000Z")
      .run();
    await database
      .prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        await sha256("session-token"),
        "user-1",
        "2099-01-01T00:00:00.000Z",
        "2026-09-13T00:00:00.000Z",
      )
      .run();

    const principal = await createBearerAuthenticator(database)(
      new Request("https://sketchy.test", {
        headers: { authorization: "Bearer session-token" },
      }),
    );
    assert.equal(principal.userId, "user-1");
    assert.equal(principal.scopes.has("project:write"), true);

    await assert.rejects(() =>
      createBearerAuthenticator(database)(
        new Request("https://sketchy.test", {
          headers: { authorization: "Bearer wrong" },
        }),
      ),
    );
  } finally {
    await miniflare.dispose();
  }
});
