import {
  createDevelopmentBearerAuthenticator,
  ProjectApiError,
  type Authenticate,
} from "./http.ts";

type SessionRow = { user_id: string; expires_at: string };

export function createBearerAuthenticator(
  database: D1Database,
  developmentToken?: string,
  developmentUserId?: string,
): Authenticate {
  const development =
    developmentToken && developmentUserId
      ? createDevelopmentBearerAuthenticator(
          developmentToken,
          developmentUserId,
        )
      : undefined;

  return async (request) => {
    if (
      development &&
      request.headers.get("authorization") === `Bearer ${developmentToken}`
    )
      return development(request);

    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) throw unauthorized();

    const row = await database
      .prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .first<SessionRow>();
    if (!row || Date.parse(row.expires_at) <= Date.now()) throw unauthorized();

    return {
      userId: row.user_id,
      scopes: new Set(["project:read", "project:write"]),
    };
  };
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function unauthorized() {
  return new ProjectApiError(401, "UNAUTHORIZED", "Authentication required.");
}
