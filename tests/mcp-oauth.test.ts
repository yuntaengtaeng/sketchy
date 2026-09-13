import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import { sha256 } from "../src/api/authentication.ts";
import { createMcpOAuthHandler } from "../src/api/mcp-oauth.ts";

test("registers Codex and exchanges a PKCE code once", async () => {
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      d1Databases: ["DB"],
    }),
  );
  try {
    const DB = await miniflare.getD1Database("DB");
    for (const name of [
      "0001_projects.sql",
      "0002_auth.sql",
      "0003_mcp_oauth.sql",
    ])
      await DB.exec(
        (await readFile(`migrations/${name}`, "utf8")).replace(/\s+/g, " "),
      );
    const session = "figma-browser-session";
    await DB.batch([
      DB.prepare("INSERT INTO users (id, created_at) VALUES (?, ?)").bind(
        "user-1",
        new Date().toISOString(),
      ),
      DB.prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      ).bind(
        await sha256(session),
        "user-1",
        new Date(Date.now() + 60_000).toISOString(),
        new Date().toISOString(),
      ),
    ]);
    const oauth = createMcpOAuthHandler({ DB });
    const registered = await oauth(
      new Request("https://sketchy.test/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_name: "Codex",
          redirect_uris: ["http://127.0.0.1/callback"],
        }),
      }),
    );
    assert.equal(registered?.status, 201);
    const { client_id: clientId } = (await registered!.json()) as {
      client_id: string;
    };

    const verifier = "a".repeat(48);
    const challenge = await base64Sha256(verifier);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: "http://127.0.0.1/callback",
      state: "client-state",
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource: "https://sketchy.test/mcp",
    });
    const consent = await oauth(
      new Request(`https://sketchy.test/authorize?${params}`, {
        headers: { cookie: `sketchy_browser_session=${session}` },
      }),
    );
    assert.equal(consent?.status, 200);
    assert.match(await consent!.text(), /Allow access/);

    params.set("decision", "allow");
    const approved = await oauth(
      new Request("https://sketchy.test/authorize", {
        method: "POST",
        headers: {
          cookie: `sketchy_browser_session=${session}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: params,
      }),
    );
    assert.equal(approved?.status, 302);
    const code = new URL(approved!.headers.get("location")!).searchParams.get(
      "code",
    )!;
    const tokenRequest = () =>
      oauth(
        new Request("https://sketchy.test/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: clientId,
            redirect_uri: "http://127.0.0.1/callback",
            code_verifier: verifier,
            resource: "https://sketchy.test/mcp",
          }),
        }),
      );
    const exchanged = await tokenRequest();
    assert.equal(exchanged?.status, 200);
    assert.equal(
      typeof ((await exchanged!.json()) as { access_token: unknown })
        .access_token,
      "string",
    );
    assert.equal((await tokenRequest())?.status, 400);
  } finally {
    await miniflare.dispose();
  }
});

async function base64Sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Buffer.from(digest).toString("base64url");
}
