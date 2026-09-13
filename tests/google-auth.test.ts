import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import { createBearerAuthenticator } from "../src/api/authentication.ts";
import { createGoogleAuthHandler } from "../src/api/google-auth.ts";

test("exchanges a Google login for a one-time Sketchy session", async () => {
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      d1Databases: ["DB"],
    }),
  );
  try {
    const DB = await miniflare.getD1Database("DB");
    await DB.exec(
      (await readFile("migrations/0002_auth.sql", "utf8")).replace(/\s+/g, " "),
    );
    const environment = {
      DB,
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
    };
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token")
        return Response.json({ access_token: "google-access" });
      if (url === "https://openidconnect.googleapis.com/v1/userinfo")
        return Response.json({
          sub: "google-user",
          email: "user@example.com",
          email_verified: true,
          name: "Sketchy User",
        });
      throw new Error(`Unexpected request: ${url}`);
    };
    const auth = createGoogleAuthHandler(environment, fetcher);

    const started = await auth(
      new Request("https://sketchy.test/auth/plugin/start", { method: "POST" }),
    );
    assert.equal(started?.status, 201);
    const login = (await started!.json()) as {
      handoffId: string;
      pollToken: string;
      authorizationUrl: string;
    };

    const redirected = await auth(new Request(login.authorizationUrl));
    assert.equal(redirected?.status, 302);
    const googleUrl = new URL(redirected!.headers.get("location")!);
    assert.equal(googleUrl.searchParams.get("scope"), "openid email profile");
    const state = googleUrl.searchParams.get("state")!;
    const stateCookie = redirected!.headers.get("set-cookie")!.split(";", 1)[0];

    const completed = await auth(
      new Request(
        `https://sketchy.test/auth/google/callback?code=google-code&state=${state}`,
        { headers: { cookie: stateCookie } },
      ),
    );
    assert.equal(completed?.status, 200);

    const polled = await auth(
      new Request("https://sketchy.test/auth/plugin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(login),
      }),
    );
    assert.equal(polled?.status, 200);
    const session = (await polled!.json()) as {
      token: string;
      user: { id: string; email: string };
    };
    assert.match(session.user.id, /^user-/);
    assert.equal(session.user.email, "user@example.com");

    const principal = await createBearerAuthenticator(DB)(
      new Request("https://sketchy.test/api/v1/projects/project", {
        headers: { authorization: `Bearer ${session.token}` },
      }),
    );
    assert.equal(principal.userId, session.user.id);

    const reused = await auth(
      new Request("https://sketchy.test/auth/plugin/session", {
        method: "POST",
        body: JSON.stringify(login),
      }),
    );
    assert.equal(reused?.status, 404);
  } finally {
    await miniflare.dispose();
  }
});
