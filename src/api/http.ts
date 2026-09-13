import * as z from "zod/v4";
import type {
  ProjectChangeRequest,
  ProjectDocument,
} from "../core/project-change.ts";
import {
  applyProjectChangesSchema,
  projectChangeRequestSchema,
  projectDocumentSchema,
} from "../mcp/schemas.ts";
import {
  ProjectService,
  ProjectServiceError,
  type ProjectPrincipal,
} from "./project-service.ts";

export type Authenticate = (request: Request) => Promise<ProjectPrincipal>;

export function createProjectApi(
  service: ProjectService,
  authenticate: Authenticate,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const principal = await authenticate(request);
      return await route(service, principal, request);
    } catch (error) {
      if (error instanceof ProjectServiceError)
        return failure(error.status, error.code, error.message);
      if (error instanceof ProjectApiError)
        return failure(error.status, error.code, error.message);
      return failure(500, "INTERNAL_ERROR", "Unexpected server error.");
    }
  };
}

export function createDevelopmentBearerAuthenticator(
  token: string,
  userId: string,
): Authenticate {
  if (!token || !userId)
    throw new Error("Development authentication needs a token and user ID.");

  return async (request) => {
    if (request.headers.get("authorization") !== `Bearer ${token}`)
      throw new ProjectApiError(
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    return {
      userId,
      scopes: new Set(["project:read", "project:write"]),
    };
  };
}

async function route(
  service: ProjectService,
  principal: ProjectPrincipal,
  request: Request,
) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "v1" || parts[2] !== "projects")
    throw new ProjectApiError(404, "ROUTE_NOT_FOUND", "Route does not exist.");

  if (request.method === "POST" && parts.length === 3) {
    const document = (await readJson(
      request,
      projectDocumentSchema.strict(),
    )) as ProjectDocument;
    return success(await service.create(principal, document), 201);
  }

  const projectId = parts[3];
  if (!projectId)
    throw new ProjectApiError(404, "ROUTE_NOT_FOUND", "Route does not exist.");

  if (request.method === "GET" && parts.length === 4)
    return success(await service.getProject(principal, projectId));

  if (request.method === "GET" && parts.length === 6 && parts[4] === "screens")
    return success(await service.getScreen(principal, projectId, parts[5]));

  if (
    request.method === "POST" &&
    parts.length === 5 &&
    parts[4] === "previews"
  ) {
    const change = (await readJson(
      request,
      projectChangeRequestSchema,
    )) as ProjectChangeRequest;
    return success(await service.preview(principal, projectId, change));
  }

  if (
    request.method === "POST" &&
    parts.length === 5 &&
    parts[4] === "changes"
  ) {
    const { previewId, ...change } = await readJson(
      request,
      applyProjectChangesSchema,
    );
    return success(
      await service.apply(
        principal,
        projectId,
        previewId,
        change as ProjectChangeRequest,
      ),
    );
  }

  throw new ProjectApiError(404, "ROUTE_NOT_FOUND", "Route does not exist.");
}

async function readJson<T extends z.ZodType>(request: Request, schema: T) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ProjectApiError(
      400,
      "INVALID_REQUEST",
      "Content-Type must be application/json.",
    );

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ProjectApiError(400, "INVALID_REQUEST", "Invalid JSON body.");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new ProjectApiError(400, "INVALID_REQUEST", "Invalid request body.");
  return parsed.data as z.output<T>;
}

function success(value: unknown, status = 200) {
  return Response.json(value, { status });
}

function failure(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export class ProjectApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
