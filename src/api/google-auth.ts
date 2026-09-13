import { sha256 } from "./authentication.ts";

export type GoogleAuthEnvironment = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

type HandoffRow = {
  id: string;
  poll_token_hash: string;
  oauth_state: string;
  user_id: string | null;
  session_token: string | null;
  expires_at: string;
};

type GoogleUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export function createGoogleAuthHandler(
  environment: GoogleAuthEnvironment,
  fetcher: typeof fetch = fetch,
) {
  return async (request: Request): Promise<Response | undefined> => {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname.startsWith("/auth/"))
      return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method === "POST" && url.pathname === "/auth/plugin/start")
      return start(environment, request);
    if (request.method === "GET" && url.pathname === "/auth/google/start")
      return redirectToGoogle(environment, request);
    if (request.method === "GET" && url.pathname === "/auth/google/callback")
      return callback(environment, request, fetcher);
    if (request.method === "POST" && url.pathname === "/auth/plugin/session")
      return poll(environment, request);
  };
}

async function start(environment: GoogleAuthEnvironment, request: Request) {
  requireGoogleConfiguration(environment);
  const id = randomToken();
  const pollToken = randomToken();
  const state = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60_000).toISOString();
  await environment.DB.prepare(
    `INSERT INTO auth_handoffs
      (id, poll_token_hash, oauth_state, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, await sha256(pollToken), state, expiresAt, now.toISOString())
    .run();

  return json(
    {
      handoffId: id,
      pollToken,
      authorizationUrl: new URL(
        `/auth/google/start?handoffId=${encodeURIComponent(id)}`,
        request.url,
      ).toString(),
      expiresAt,
    },
    201,
  );
}

async function redirectToGoogle(
  environment: GoogleAuthEnvironment,
  request: Request,
) {
  requireGoogleConfiguration(environment);
  const requestUrl = new URL(request.url);
  const handoff = await readHandoff(
    environment.DB,
    requestUrl.searchParams.get("handoffId"),
  );
  if (!handoff) return jsonError(400, "LOGIN_EXPIRED", "Start again.");

  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.search = new URLSearchParams({
    client_id: environment.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(request),
    response_type: "code",
    scope: "openid email profile",
    state: handoff.oauth_state,
    prompt: "select_account",
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      location: google.toString(),
      "set-cookie": `sketchy_oauth_state=${handoff.oauth_state}; HttpOnly; Secure; SameSite=Lax; Path=/auth/google/callback; Max-Age=600`,
      "cache-control": "no-store",
    },
  });
}

async function callback(
  environment: GoogleAuthEnvironment,
  request: Request,
  fetcher: typeof fetch,
) {
  requireGoogleConfiguration(environment);
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code || cookie(request, "sketchy_oauth_state") !== state)
    return html(
      "Sign-in could not be verified. Return to Figma and try again.",
      400,
    );

  const handoff = await environment.DB.prepare(
    "SELECT * FROM auth_handoffs WHERE oauth_state = ? AND expires_at > ?",
  )
    .bind(state, new Date().toISOString())
    .first<HandoffRow>();
  if (!handoff)
    return html(
      "This sign-in request expired. Return to Figma and try again.",
      400,
    );

  const tokenResponse = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: environment.GOOGLE_CLIENT_ID!,
      client_secret: environment.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl(request),
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenResponse.ok || !tokens.access_token)
    return html("Google sign-in failed. Return to Figma and try again.", 502);

  const userResponse = await fetcher(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { authorization: `Bearer ${tokens.access_token}` } },
  );
  const googleUser = (await userResponse.json()) as Partial<GoogleUser>;
  if (
    !userResponse.ok ||
    !googleUser.sub ||
    !googleUser.email ||
    googleUser.email_verified !== true
  )
    return html("Google account could not be verified.", 502);

  const userId = await upsertGoogleUser(
    environment.DB,
    googleUser as GoogleUser,
  );
  const sessionToken = randomToken();
  const now = new Date();
  await environment.DB.batch([
    environment.DB.prepare(
      `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
    ).bind(
      await sha256(sessionToken),
      userId,
      new Date(now.getTime() + 30 * 24 * 60 * 60_000).toISOString(),
      now.toISOString(),
    ),
    environment.DB.prepare(
      `UPDATE auth_handoffs SET user_id = ?, session_token = ?
       WHERE id = ? AND session_token IS NULL`,
    ).bind(userId, sessionToken, handoff.id),
  ]);

  return html(
    "You're connected to Sketchy. Return to Figma to continue.",
    200,
    sessionToken,
  );
}

async function poll(environment: GoogleAuthEnvironment, request: Request) {
  const body = (await request.json().catch(() => undefined)) as
    { handoffId?: unknown; pollToken?: unknown } | undefined;
  if (typeof body?.handoffId !== "string" || typeof body.pollToken !== "string")
    return jsonError(400, "INVALID_REQUEST", "Invalid sign-in request.");

  const handoff = await readHandoff(environment.DB, body.handoffId);
  if (!handoff || handoff.poll_token_hash !== (await sha256(body.pollToken)))
    return jsonError(404, "LOGIN_NOT_FOUND", "Start again.");
  if (!handoff.session_token || !handoff.user_id)
    return json({ status: "pending" }, 202);

  const identity = await environment.DB.prepare(
    `SELECT email, name, picture_url FROM external_identities
     WHERE provider = 'google' AND user_id = ?`,
  )
    .bind(handoff.user_id)
    .first<{
      email: string;
      name: string | null;
      picture_url: string | null;
    }>();
  await environment.DB.prepare("DELETE FROM auth_handoffs WHERE id = ?")
    .bind(handoff.id)
    .run();
  return json({
    status: "complete",
    token: handoff.session_token,
    user: {
      id: handoff.user_id,
      email: identity?.email,
      name: identity?.name,
      pictureUrl: identity?.picture_url,
    },
  });
}

async function upsertGoogleUser(database: D1Database, google: GoogleUser) {
  const existing = await database
    .prepare(
      "SELECT user_id FROM external_identities WHERE provider = 'google' AND subject = ?",
    )
    .bind(google.sub)
    .first<{ user_id: string }>();
  const userId = existing?.user_id ?? `user-${crypto.randomUUID()}`;
  if (!existing)
    await database.batch([
      database
        .prepare("INSERT INTO users (id, created_at) VALUES (?, ?)")
        .bind(userId, new Date().toISOString()),
      database
        .prepare(
          `INSERT INTO external_identities
            (provider, subject, user_id, email, name, picture_url)
           VALUES ('google', ?, ?, ?, ?, ?)`,
        )
        .bind(
          google.sub,
          userId,
          google.email,
          google.name ?? null,
          google.picture ?? null,
        ),
    ]);
  else
    await database
      .prepare(
        `UPDATE external_identities SET email = ?, name = ?, picture_url = ?
         WHERE provider = 'google' AND subject = ?`,
      )
      .bind(
        google.email,
        google.name ?? null,
        google.picture ?? null,
        google.sub,
      )
      .run();
  return userId;
}

async function readHandoff(database: D1Database, id: string | null) {
  if (!id) return undefined;
  return database
    .prepare("SELECT * FROM auth_handoffs WHERE id = ? AND expires_at > ?")
    .bind(id, new Date().toISOString())
    .first<HandoffRow>();
}

function callbackUrl(request: Request) {
  return new URL("/auth/google/callback", request.url).toString();
}

function cookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function requireGoogleConfiguration(environment: GoogleAuthEnvironment) {
  if (!environment.GOOGLE_CLIENT_ID || !environment.GOOGLE_CLIENT_SECRET)
    throw new Error("Google authentication is not configured.");
}

function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { ...corsHeaders(), "cache-control": "no-store" },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function jsonError(status: number, code: string, message: string) {
  return json({ error: { code, message } }, status);
}

function html(message: string, status = 200, browserSession?: string) {
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width"><title>Sketchy</title><main><h1>Sketchy</h1><p>${message}</p></main>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "set-cookie": browserSession
          ? `sketchy_browser_session=${browserSession}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
          : "sketchy_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/auth/google/callback; Max-Age=0",
      },
    },
  );
}
