import { D1ProjectStore } from "./api/d1-project-store.ts";
import { createProjectApi } from "./api/http.ts";
import { createBearerAuthenticator } from "./api/authentication.ts";
import { ProjectService } from "./api/project-service.ts";
import { createRemoteMcpHandler } from "./mcp/http.ts";

export type WorkerEnvironment = {
  DB: D1Database;
  SKETCHY_API_TOKEN: string;
  SKETCHY_USER_ID: string;
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
  if (url.pathname === "/mcp") {
    let principal;
    try {
      principal = await authenticate(request);
    } catch {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        },
        { status: 401 },
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
