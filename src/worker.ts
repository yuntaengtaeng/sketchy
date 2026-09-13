import { D1ProjectStore } from "./api/d1-project-store.ts";
import { createProjectApi } from "./api/http.ts";
import { createBearerAuthenticator } from "./api/authentication.ts";
import { ProjectService } from "./api/project-service.ts";
import { createRemoteMcpHandler } from "./mcp/http.ts";
import { createGoogleAuthHandler } from "./api/google-auth.ts";
import { createMcpOAuthHandler } from "./api/mcp-oauth.ts";

export type WorkerEnvironment = {
  DB: D1Database;
  SKETCHY_API_TOKEN: string;
  SKETCHY_USER_ID: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export async function handleRequest(
  request: Request,
  environment: WorkerEnvironment,
) {
  const service = new ProjectService(new D1ProjectStore(environment.DB));
  const authenticate = createBearerAuthenticator(
    environment.DB,
    environment.SKETCHY_API_TOKEN,
    environment.SKETCHY_USER_ID,
  );
  const url = new URL(request.url);
  const oauthResponse = await createMcpOAuthHandler(environment)(request);
  if (oauthResponse) return oauthResponse;
  const authResponse = await createGoogleAuthHandler(environment)(request);
  if (authResponse) return authResponse;
  if (url.pathname === "/mcp") {
    let principal;
    try {
      principal = await authenticate(request);
    } catch {
      const resourceMetadata = `${url.origin}/.well-known/oauth-protected-resource/mcp`;
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        },
        {
          status: 401,
          headers: {
            "www-authenticate": `Bearer resource_metadata="${resourceMetadata}"`,
          },
        },
      );
    }
    const projectId = url.searchParams.get("projectId");
    if (!projectId)
      return Response.json(
        {
          error: {
            code: "PROJECT_ID_REQUIRED",
            message: "projectId is required.",
          },
        },
        { status: 400 },
      );
    return createRemoteMcpHandler(service, principal, projectId).fetch(request);
  }
  return createProjectApi(service, authenticate)(request);
}

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<WorkerEnvironment>;
