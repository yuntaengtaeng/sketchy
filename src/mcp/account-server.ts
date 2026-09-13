import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { ProjectChangeRequest } from "../core/project-change.ts";
import {
  applyProjectChangesSchema,
  projectChangeRequestSchema,
} from "./schemas.ts";

export type AccountProjectAccess = {
  listProjects(): Promise<unknown>;
  getProject(projectId?: string): Promise<unknown>;
  getScreen(projectId: string | undefined, screenId: string): Promise<unknown>;
  preview(
    projectId: string | undefined,
    request: Omit<ProjectChangeRequest, "projectId">,
  ): Promise<unknown>;
  apply(
    projectId: string | undefined,
    previewId: string,
    request: Omit<ProjectChangeRequest, "projectId">,
  ): Promise<unknown>;
};

export function createSketchyAccountMcpServer(access: AccountProjectAccess) {
  const server = new McpServer(
    { name: "sketchy", version: "0.1.0" },
    {
      instructions:
        "When there is one project, use it by default. With multiple projects, list them when the target is unclear. Read the selected project first. Preview every change batch, show its summary and warnings, and apply only after explicit user approval.",
    },
  );

  server.registerTool(
    "list_projects",
    {
      title: "List Sketchy projects",
      description: "List Figma projects connected to this Sketchy account.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => result(await access.listProjects()),
  );
  server.registerTool(
    "get_project",
    {
      title: "Get Sketchy project",
      description: "Get one project's revision, settings, and screen list.",
      inputSchema: z.object({ projectId: z.string().min(1).optional() }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId }) => result(await access.getProject(projectId)),
  );
  server.registerTool(
    "get_screen",
    {
      title: "Get Sketchy screen",
      description: "Get one screen with its elements and features.",
      inputSchema: z.object({
        projectId: z.string().min(1).optional(),
        screenId: z.string().min(1),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ projectId, screenId }) =>
      result(await access.getScreen(projectId, screenId)),
  );
  server.registerTool(
    "preview_project_changes",
    {
      title: "Preview Sketchy project changes",
      description: "Validate an atomic batch without saving it.",
      inputSchema: projectChangeRequestSchema.partial({ projectId: true }),
      annotations: { readOnlyHint: true },
    },
    async (request) =>
      result(
        await access.preview(
          request.projectId,
          request as Omit<ProjectChangeRequest, "projectId">,
        ),
      ),
  );
  server.registerTool(
    "apply_project_changes",
    {
      title: "Apply Sketchy project changes",
      description: "Save the exact batch returned by preview.",
      inputSchema: applyProjectChangesSchema.partial({ projectId: true }),
    },
    async ({ previewId, ...request }) =>
      result(
        await access.apply(
          request.projectId,
          previewId,
          request as Omit<ProjectChangeRequest, "projectId">,
        ),
      ),
  );
  return server;
}

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}
