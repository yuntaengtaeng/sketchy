import { sha256 } from "./authentication.ts";

type OAuthEnvironment = { DB: D1Database };

type ClientRow = { redirect_uris: string; client_name: string | null };

type CodeRow = {
  client_id: string;
  user_id: string;
  redirect_uri: string;
  code_challenge: string;
  resource: string;
  expires_at: string;
};

export function createMcpOAuthHandler(environment: OAuthEnvironment) {
  return async (request: Request): Promise<Response | undefined> => {
    const url = new URL(request.url);
    if (
      request.method === "GET" &&
      (url.pathname === "/.well-known/oauth-protected-resource" ||
        url.pathname === "/.well-known/oauth-protected-resource/mcp")
    )
      return Response.json({
        resource: `${url.origin}/mcp`,
        authorization_servers: [url.origin],
        scopes_supported: ["project:read", "project:write"],
      });
    if (
      request.method === "GET" &&
      url.pathname === "/.well-known/oauth-authorization-server"
    )
      return Response.json({
        issuer: url.origin,
        authorization_endpoint: `${url.origin}/authorize`,
        token_endpoint: `${url.origin}/token`,
        registration_endpoint: `${url.origin}/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        token_endpoint_auth_methods_supported: ["none"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["project:read", "project:write"],
        authorization_response_iss_parameter_supported: true,
      });
    if (request.method === "POST" && url.pathname === "/register")
      return register(environment.DB, request);
    if (url.pathname === "/authorize")
      return authorize(environment.DB, request);
    if (request.method === "POST" && url.pathname === "/token")
      return token(environment.DB, request);
  };
}

async function register(database: D1Database, request: Request) {
  const body = (await request.json().catch(() => undefined)) as
    { redirect_uris?: unknown; client_name?: unknown } | undefined;
  if (
    !Array.isArray(body?.redirect_uris) ||
    !body.redirect_uris.length ||
    !body.redirect_uris.every(validRedirectUri)
  )
    return oauthError(400, "invalid_redirect_uri");

  const clientId = `client-${crypto.randomUUID()}`;
  await database
    .prepare(
      `INSERT INTO oauth_clients (id, redirect_uris, client_name, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      clientId,
      JSON.stringify(body.redirect_uris),
      typeof body.client_name === "string" ? body.client_name : null,
      new Date().toISOString(),
    )
    .run();
  return Response.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: body.redirect_uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}

async function authorize(database: D1Database, request: Request) {
  const params =
    request.method === "POST"
      ? new URLSearchParams(await request.text())
      : new URL(request.url).searchParams;
  const validation = await validateAuthorization(
    database,
    params,
    new URL(request.url).origin,
  );
  if (validation instanceof Response) return validation;

  const session = cookie(request, "sketchy_browser_session");
  const user = session
    ? await database
        .prepare(
          `SELECT user_id FROM sessions
           WHERE token_hash = ? AND expires_at > ?`,
        )
        .bind(await sha256(session), new Date().toISOString())
        .first<{ user_id: string }>()
    : undefined;
  if (!user)
    return html(
      "Sign in to Sketchy from the Figma plugin, then try connecting Codex again.",
      401,
    );

  if (request.method !== "POST")
    return consent(
      params,
      new URL(params.get("resource")!).searchParams.get("projectId"),
      validation.client_name,
    );
  if (params.get("decision") !== "allow")
    return redirectError(params, "access_denied");

  const code = randomToken();
  const now = new Date();
  await database
    .prepare(
      `INSERT INTO oauth_codes
        (code_hash, client_id, user_id, redirect_uri, code_challenge,
         resource, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      await sha256(code),
      params.get("client_id"),
      user.user_id,
      params.get("redirect_uri"),
      params.get("code_challenge"),
      params.get("resource"),
      new Date(now.getTime() + 5 * 60_000).toISOString(),
      now.toISOString(),
    )
    .run();
  const redirect = new URL(params.get("redirect_uri")!);
  redirect.searchParams.set("code", code);
  redirect.searchParams.set("state", params.get("state")!);
  redirect.searchParams.set("iss", new URL(request.url).origin);
  return Response.redirect(redirect.toString(), 302);
}

async function validateAuthorization(
  database: D1Database,
  params: URLSearchParams,
  origin: string,
) {
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const resource = params.get("resource");
  let resourceUrl: URL | undefined;
  try {
    resourceUrl = resource ? new URL(resource) : undefined;
  } catch {
    // Rejected below.
  }
  if (
    params.get("response_type") !== "code" ||
    !clientId ||
    !redirectUri ||
    !params.get("state") ||
    !params.get("code_challenge") ||
    params.get("code_challenge_method") !== "S256" ||
    !resourceUrl ||
    resourceUrl.origin !== origin ||
    resourceUrl.pathname !== "/mcp"
  )
    return oauthError(400, "invalid_request");
  const client = await database
    .prepare(
      "SELECT redirect_uris, client_name FROM oauth_clients WHERE id = ?",
    )
    .bind(clientId)
    .first<ClientRow>();
  if (!client || !JSON.parse(client.redirect_uris).includes(redirectUri))
    return oauthError(400, "invalid_client");
  return client;
}

async function token(database: D1Database, request: Request) {
  const params = new URLSearchParams(await request.text());
  const code = params.get("code");
  const verifier = params.get("code_verifier");
  if (params.get("grant_type") !== "authorization_code" || !code || !verifier)
    return oauthError(400, "invalid_request");
  const row = await database
    .prepare("SELECT * FROM oauth_codes WHERE code_hash = ?")
    .bind(await sha256(code))
    .first<CodeRow>();
  if (
    !row ||
    row.client_id !== params.get("client_id") ||
    row.redirect_uri !== params.get("redirect_uri") ||
    row.resource !== params.get("resource") ||
    Date.parse(row.expires_at) <= Date.now() ||
    (await pkceChallenge(verifier)) !== row.code_challenge
  )
    return oauthError(400, "invalid_grant");

  const accessToken = randomToken();
  const now = new Date();
  await database.batch([
    database
      .prepare("DELETE FROM oauth_codes WHERE code_hash = ?")
      .bind(await sha256(code)),
    database
      .prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        await sha256(accessToken),
        row.user_id,
        new Date(now.getTime() + 30 * 24 * 60 * 60_000).toISOString(),
        now.toISOString(),
      ),
  ]);
  return Response.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 30 * 24 * 60 * 60,
      scope: "project:read project:write",
    },
    { headers: { "cache-control": "no-store" } },
  );
}

function consent(
  params: URLSearchParams,
  projectId: string | null,
  clientName: string | null,
) {
  const agent = escape(clientName || "AI agent");
  const fields = [...params].map(
    ([key, value]) =>
      `<input type="hidden" name="${escape(key)}" value="${escape(value)}">`,
  );
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width"><title>Connect ${agent} · Sketchy</title><main><h1>Connect ${agent}</h1><p>Allow ${agent} to read and update your Sketchy projects?</p>${projectId ? `<p><code>${escape(projectId)}</code></p>` : ""}<form method="post">${fields.join("")}<button name="decision" value="allow">Allow access</button></form></main>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

function redirectError(params: URLSearchParams, error: string) {
  const redirect = new URL(params.get("redirect_uri")!);
  redirect.searchParams.set("error", error);
  redirect.searchParams.set("state", params.get("state")!);
  return Response.redirect(redirect.toString(), 302);
}

function validRedirectUri(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        (url.hostname === "127.0.0.1" || url.hostname === "localhost"))
    );
  } catch {
    return false;
  }
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

async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function oauthError(status: number, error: string) {
  return Response.json(
    { error },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function html(message: string, status: number) {
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width"><title>Sketchy</title><main><h1>Sketchy</h1><p>${message}</p></main>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}
